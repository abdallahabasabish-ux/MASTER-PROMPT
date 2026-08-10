import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AdminTeacherService {
  // جلب جميع المدرسين مع خيارات الفلترة
  static async getTeachers(filters?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.search) {
      where.OR = [
        { user: { fullName: { contains: filters.search, mode: 'insensitive' } } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const [teachers, total] = await Promise.all([
      prisma.teacher.findMany({
        where,
        include: {
          user: {
            select: { id: true, fullName: true, email: true, phone: true, createdAt: true },
          },
          gradeSubjects: {
            include: { grade: true, subject: true },
          },
          lessons: {
            select: { id: true, title: true, status: true },
          },
          assignments: {
            select: { id: true, title: true, status: true },
          },
          exams: {
            select: { id: true, title: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.teacher.count({ where }),
    ]);

    return {
      data: teachers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // تغيير حالة المدرس
  static async updateTeacherStatus(
    teacherId: string,
    status: 'APPROVED' | 'REJECTED' | 'SUSPENDED',
    adminUserId: string,
    reason?: string
  ) {
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: { user: true },
    });
    if (!teacher) throw new Error('المدرس غير موجود');

    const updated = await prisma.teacher.update({
      where: { id: teacherId },
      data: {
        status,
        approvedAt: status === 'APPROVED' ? new Date() : undefined,
      },
      include: { user: true },
    });

    // تسجيل في Audit Log
    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: `TEACHER_${status}`,
        targetType: 'Teacher',
        targetId: teacherId,
        metadata: { reason, teacherName: teacher.user.fullName },
      },
    });

    return updated;
  }

  // جلب تفاصيل المدرس مع محتواه
  static async getTeacherDetails(teacherId: string) {
    return prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        user: true,
        gradeSubjects: {
          include: { grade: true, subject: true },
        },
        lessons: {
          include: { unit: { include: { subject: true } } },
          orderBy: { createdAt: 'desc' },
        },
        assignments: {
          include: { lesson: true },
          orderBy: { createdAt: 'desc' },
        },
        exams: {
          include: { grade: true, unit: true },
          orderBy: { createdAt: 'desc' },
        },
        questions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  // حذف مدرس (مع حذف محتواه)
  static async deleteTeacher(teacherId: string, adminUserId: string) {
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: { user: true },
    });
    if (!teacher) throw new Error('المدرس غير موجود');

    // حذف المحتوى المرتبط
    await prisma.$transaction(async (tx) => {
      // حذف الدروس
      const lessons = await tx.lesson.findMany({
        where: { teacherId },
        select: { id: true },
      });
      const lessonIds = lessons.map(l => l.id);

      await tx.lessonContent.deleteMany({ where: { lessonId: { in: lessonIds } } });
      await tx.lessonVideo.deleteMany({ where: { lessonId: { in: lessonIds } } });
      await tx.lessonFile.deleteMany({ where: { lessonId: { in: lessonIds } } });
      await tx.lesson.deleteMany({ where: { id: { in: lessonIds } } });

      // حذف الواجبات والأسئلة
      await tx.assignmentQuestion.deleteMany({
        where: { assignment: { teacherId } },
      });
      await tx.assignment.deleteMany({ where: { teacherId } });

      // حذف الامتحانات
      await tx.examQuestion.deleteMany({ where: { exam: { teacherId } } });
      await tx.exam.deleteMany({ where: { teacherId } });

      // حذف الأسئلة
      await tx.question.deleteMany({ where: { teacherId } });

      // حذف العلاقات
      await tx.teacherGradeSubject.deleteMany({ where: { teacherId } });

      // حذف المدرس
      await tx.teacher.delete({ where: { id: teacherId } });

      // حذف المستخدم (soft delete)
      await tx.user.update({
        where: { id: teacher.userId },
        data: { deletedAt: new Date() },
      });
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'DELETE_TEACHER',
        targetType: 'Teacher',
        targetId: teacherId,
        metadata: { teacherName: teacher.user.fullName },
      },
    });

    return { success: true };
  }
}
