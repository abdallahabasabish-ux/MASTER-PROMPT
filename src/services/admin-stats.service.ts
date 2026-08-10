import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AdminStatsService {
  static async getDashboardStats() {
    // إجمالي الطلاب
    const totalStudents = await prisma.student.count();

    // إجمالي المدرسين
    const totalTeachers = await prisma.teacher.count();

    // المدرسون بانتظار الموافقة
    const pendingTeachers = await prisma.teacher.count({
      where: { status: 'PENDING' },
    });

    // إجمالي الدروس المنشورة
    const publishedLessons = await prisma.lesson.count({
      where: { status: 'PUBLISHED' },
    });

    // إجمالي الواجبات المنشورة
    const publishedAssignments = await prisma.assignment.count({
      where: { status: 'PUBLISHED' },
    });

    // إجمالي الامتحانات المنشورة
    const publishedExams = await prisma.exam.count({
      where: { status: 'PUBLISHED' },
    });

    // الاشتراكات النشطة
    const activeSubscriptions = await prisma.student.count({
      where: { subscriptionStatus: 'ACTIVE' },
    });

    // الاشتراكات المنتهية
    const expiredSubscriptions = await prisma.student.count({
      where: { subscriptionStatus: 'EXPIRED' },
    });

    // المدفوعات المعلقة
    const pendingPayments = await prisma.payment.count({
      where: { status: 'PENDING' },
    });

    // إجمالي الإيرادات (من المدفوعات المقبولة)
    const revenueResult = await prisma.payment.aggregate({
      where: { status: 'APPROVED' },
      _sum: { amount: true },
    });
    const totalRevenue = revenueResult._sum.amount || 0;

    // آخر النشاطات (آخر 10 سجلات من AuditLog)
    const recentActivities = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: { fullName: true, email: true, role: true },
        },
      },
    });

    return {
      totalStudents,
      totalTeachers,
      pendingTeachers,
      publishedLessons,
      publishedAssignments,
      publishedExams,
      activeSubscriptions,
      expiredSubscriptions,
      pendingPayments,
      totalRevenue,
      recentActivities,
    };
  }

  // إحصائيات المدفوعات الشهرية (للرسم البياني)
  static async getMonthlyRevenue(year: number) {
    const payments = await prisma.payment.findMany({
      where: {
        status: 'APPROVED',
        reviewedAt: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      },
      select: {
        amount: true,
        reviewedAt: true,
      },
    });

    // تجميع حسب الشهر
    const monthlyData = Array(12).fill(0);
    payments.forEach(p => {
      const month = new Date(p.reviewedAt!).getMonth();
      monthlyData[month] += p.amount;
    });

    return monthlyData.map((total, index) => ({
      month: index + 1,
      total,
    }));
  }

  // إحصائيات المستخدمين المسجلين (شهرياً)
  static async getMonthlyRegistrations(year: number) {
    const users = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      },
      select: {
        createdAt: true,
        role: true,
      },
    });

    const monthlyData = Array(12).fill(0);
    users.forEach(u => {
      const month = new Date(u.createdAt).getMonth();
      monthlyData[month] += 1;
    });

    return monthlyData.map((count, index) => ({
      month: index + 1,
      count,
    }));
  }
}
