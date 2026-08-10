import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AdminStudentService {
  // جلب الطلاب مع خيارات الفلترة
  static async getStudents(filters?: {
    gradeId?: string;
    stageId?: string;
    subscriptionStatus?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};
    if (filters?.gradeId) where.gradeId = filters.gradeId;
    if (filters?.stageId) where.grade = { stageId: filters.stageId };
    if (filters?.subscriptionStatus) where.subscriptionStatus = filters.subscriptionStatus;
    if (filters?.search) {
      where.OR = [
        { user: { fullName: { contains: filters.search, mode: 'insensitive' } } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          user: {
            select: { id: true, fullName: true, email: true, phone: true, createdAt: true },
          },
          grade: { include: { stage: true } },
          term: true,
          stats: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.student.count({ where }),
    ]);

    return {
      data: students,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // تغيير حالة الطالب (تعليق/تفعيل)
  static async updateStudentStatus(
    studentId: string,
    status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED',
    adminUserId: string,
    reason?: string
  ) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });
    if (!student) throw new Error('الطالب غير موجود');

    const updated = await prisma.student.update({
      where: { id: studentId },
      data: { subscriptionStatus: status },
      include: { user: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: `STUDENT_${status}`,
        targetType: 'Student',
        targetId: studentId,
        metadata: { reason, studentName: student.user.fullName },
      },
    });

    return updated;
  }

  // جلب تفاصيل الطالب (مع النشاط والنتائج)
  static async getStudentDetails(studentId: string) {
    return prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        grade: { include: { stage: true } },
        term: true,
        stats: true,
        lessonProgress: {
          include: { lesson: { include: { unit: { include: { subject: true } } } } },
          orderBy: { lastActivityAt: 'desc' },
          take: 20,
        },
        submissions: {
          include: {
            assignment: { include: { lesson: true } },
            result: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        examAttempts: {
          include: {
            exam: { include: { grade: true, unit: true } },
            result: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        payments: {
          include: { plan: true, reviewedBy: { select: { fullName: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }
}
