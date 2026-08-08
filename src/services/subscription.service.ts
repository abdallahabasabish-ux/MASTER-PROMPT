import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SubscriptionService {
  // جلب خطط الاشتراك النشطة
  static async getActivePlans() {
    return prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
  }

  // التحقق من حالة اشتراك الطالب (مع التحديث التلقائي إذا انتهى)
  static async getStudentSubscriptionStatus(userId: string) {
    const student = await prisma.student.findUnique({
      where: { userId },
      select: {
        subscriptionStatus: true,
        subscriptionStart: true,
        subscriptionEnd: true,
      },
    });
    if (!student) throw new Error('الطالب غير موجود');

    // إذا كان نشطاً ولكن التاريخ انتهى، نقوم بتحديثه
    if (student.subscriptionStatus === 'ACTIVE' && student.subscriptionEnd) {
      if (new Date(student.subscriptionEnd) < new Date()) {
        await prisma.student.update({
          where: { userId },
          data: { subscriptionStatus: 'EXPIRED' },
        });
        return { ...student, subscriptionStatus: 'EXPIRED' };
      }
    }

    return student;
  }

  // تفعيل الاشتراك يدوياً (بواسطة Admin بعد قبول الدفع)
  static async activateSubscription(studentId: string, planId: string, durationDays: number) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);

    return prisma.student.update({
      where: { id: studentId },
      data: {
        subscriptionStatus: 'ACTIVE',
        subscriptionStart: startDate,
        subscriptionEnd: endDate,
      },
    });
  }

  // إلغاء أو تعليق الاشتراك
  static async suspendSubscription(studentId: string, reason?: string) {
    return prisma.student.update({
      where: { id: studentId },
      data: {
        subscriptionStatus: 'SUSPENDED',
      },
    });
  }

  // إعادة التفعيل
  static async reactivateSubscription(studentId: string, durationDays: number) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);

    return prisma.student.update({
      where: { id: studentId },
      data: {
        subscriptionStatus: 'ACTIVE',
        subscriptionEnd: endDate,
      },
    });
  }
}
