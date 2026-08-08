import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TeacherDashboardService {
  // جلب جميع إحصائيات المدرس
  static async getDashboardStats(teacherUserId: string) {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: teacherUserId },
      include: {
        gradeSubjects: {
          include: { grade: true, subject: true },
        },
      },
    });
    if (!teacher) throw new Error('المدرس غير موجود');
    if (teacher.status !== 'APPROVED') throw new Error('المدرس غير معتمد');

    // جلب الدروس
    const lessons = await prisma.lesson.findMany({
      where: { teacherId: teacher.id },
      select: { id: true, status: true },
    });
    const totalLessons = lessons.length;
    const publishedLessons = lessons.filter(l => l.status === 'PUBLISHED').length;
    const draftLessons = lessons.filter(l => l.status === 'DRAFT').length;

    // جلب الواجبات
    const assignments = await prisma.assignment.findMany({
      where: { teacherId: teacher.id },
      include: {
        submissions: {
          include: { student: true },
        },
      },
    });
    const totalAssignments = assignments.length;
    const publishedAssignments = assignments.filter(a => a.status === 'PUBLISHED').length;
    const totalSubmissions = assignments.reduce((sum, a) => sum + a.submissions.length, 0);

    // جلب الامتحانات
    const exams = await prisma.exam.findMany({
      where: { teacherId: teacher.id },
      include: {
        attempts: {
          include: { student: true },
        },
      },
    });
    const totalExams = exams.length;
    const publishedExams = exams.filter(e => e.status === 'PUBLISHED').length;
    const totalAttempts = exams.reduce((sum, e) => sum + e.attempts.length, 0);

    // جلب الطلاب (من خلال الصفوف التي يدرسها المدرس)
    const gradeIds = teacher.gradeSubjects.map(gs => gs.gradeId);
    const students = await prisma.student.findMany({
      where: {
        gradeId: { in: gradeIds },
        subscriptionStatus: 'ACTIVE',
      },
      include: { user: true },
    });

    // الإحصائيات الأخيرة (آخر 5 أنشطة)
    const recentLessons = await prisma.lesson.findMany({
      where: { teacherId: teacher.id },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: { unit: { include: { subject: true } } },
    });

    const recentSubmissions = await prisma.submission.findMany({
      where: {
        assignment: { teacherId: teacher.id },
        status: 'SUBMITTED',
      },
      include: {
        student: { include: { user: true } },
        assignment: true,
      },
      orderBy: { submittedAt: 'desc' },
      take: 5,
    });

    return {
      teacher,
      stats: {
        totalLessons,
        publishedLessons,
        draftLessons,
        totalAssignments,
        publishedAssignments,
        totalSubmissions,
        totalExams,
        publishedExams,
        totalAttempts,
        totalStudents: students.length,
      },
      recentLessons,
      recentSubmissions,
      gradeSubjects: teacher.gradeSubjects,
    };
  }

  // جلب الطلاب المرتبطين بالمدرس مع تقدمهم
  static async getTeacherStudents(teacherUserId: string, gradeId?: string) {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: teacherUserId },
      include: {
        gradeSubjects: true,
      },
    });
    if (!teacher) throw new Error('المدرس غير موجود');

    const gradeIds = gradeId
      ? [gradeId]
      : teacher.gradeSubjects.map(gs => gs.gradeId);

    const students = await prisma.student.findMany({
      where: {
        gradeId: { in: gradeIds },
        subscriptionStatus: 'ACTIVE',
      },
      include: {
        user: true,
        grade: true,
        stats: true,
        lessonProgress: {
          include: { lesson: true },
        },
        submissions: {
          include: { assignment: true },
        },
      },
    });

    // حساب التقدم لكل طالب
    return students.map(student => {
      const totalLessons = student.lessonProgress.length;
      const completedLessons = student.lessonProgress.filter(p => p.status === 'COMPLETED').length;
      const totalAssignments = student.submissions.length;
      const completedAssignments = student.submissions.filter(s => s.status === 'COMPLETED').length;
      const avgScore = student.stats?.averageScore || 0;

      return {
        id: student.id,
        name: student.user.fullName,
        email: student.user.email,
        grade: student.grade?.name,
        subscriptionStatus: student.subscriptionStatus,
        progress: {
          lessons: { total: totalLessons, completed: completedLessons },
          assignments: { total: totalAssignments, completed: completedAssignments },
          averageScore: avgScore,
        },
        lastActive: student.stats?.lastActiveAt || student.updatedAt,
      };
    });
  }

  // جلب تقدم طالب محدد (للمدرس)
  static async getStudentProgress(teacherUserId: string, studentId: string) {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: teacherUserId },
      include: { gradeSubjects: true },
    });
    if (!teacher) throw new Error('المدرس غير موجود');

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        grade: { include: { stage: true } },
        term: true,
        stats: true,
        lessonProgress: {
          include: {
            lesson: {
              include: {
                unit: { include: { subject: true } },
              },
            },
          },
          orderBy: { lesson: { order: 'asc' } },
        },
        submissions: {
          include: {
            assignment: true,
            result: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        examAttempts: {
          include: {
            exam: true,
            result: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!student) throw new Error('الطالب غير موجود');

    // التحقق من أن الطالب في صف يدرسه المدرس
    const isInGrade = teacher.gradeSubjects.some(gs => gs.gradeId === student.gradeId);
    if (!isInGrade) throw new Error('هذا الطالب ليس في صفوفك');

    return student;
  }
}
