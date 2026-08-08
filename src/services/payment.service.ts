import { PrismaClient, PaymentStatus } from '@prisma/client';
import { StorageService } from './storage.service'; // سنستخدمها لحفظ الصور
import { SubscriptionService } from './subscription.service';

const prisma = new PrismaClient();

export class PaymentService {
  // إنشاء طلب دفع جديد (يقوم به الطالب)
  static async createPayment(data: {
    studentId: string; // معرف الطالب الداخلي (من الـ middleware)
    planId: string;
    paymentMethod: string;
    notes?: string;
  }) {
    // التحقق من الخطة
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: data.planId, isActive: true },
    });
    if (!plan) throw new Error('خطة الاشتراك غير موجودة أو غير نشطة');

    // التحقق من عدم وجود طلب دفع معلق لنفس الطالب ونفس الخطة
    const existingPending = await prisma.payment.findFirst({
      where: {
        studentId: data.studentId,
        planId: data.planId,
        status: 'PENDING',
      },
    });
    if (existingPending) {
      throw new Error('لديك طلب دفع معلق بالفعل لهذه الخطة. يرجى انتظار المراجعة أو رفع إثبات جديد.');
    }

    // إنشاء سجل الدفع
    const payment = await prisma.payment.create({
      data: {
        studentId: data.studentId,
        planId: data.planId,
        amount: plan.price,
        paymentMethod: data.paymentMethod as any,
        notes: data.notes,
        status: 'PENDING',
      },
      include: {
        plan: true,
        student: {
          include: { user: true },
        },
      },
    });

    // تسجيل في Audit Log
    await prisma.auditLog.create({
      data: {
        userId: payment.student.userId,
        action: 'CREATE_PAYMENT',
        targetType: 'Payment',
        targetId: payment.id,
        metadata: { amount: payment.amount, method: payment.paymentMethod },
      },
    });

    return payment;
  }

  // رفع إثبات الدفع (صورة)
  static async uploadProof(paymentId: string, studentId: string, fileBuffer: Buffer, mimeType: string) {
    // التحقق من أن الدفع يخص هذا الطالب
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, studentId },
    });
    if (!payment) throw new Error('طلب الدفع غير موجود أو لا يخصك');
    if (payment.status !== 'PENDING') throw new Error('لا يمكن رفع إثبات بعد مراجعة الطلب');

    // التحقق من حجم الملف (نفترض الحد الأقصى 5 ميجابايت)
    // التحقق من نوع الملف (صور فقط)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(mimeType)) {
      throw new Error('نوع الملف غير مدعوم. يرجى رفع صورة بصيغة JPG, PNG أو WEBP');
    }

    // رفع الملف إلى التخزين (نفترض وجود StorageService)
    const fileName = `payments/${paymentId}_${Date.now()}.${mimeType.split('/')[1]}`;
    const fileUrl = await StorageService.uploadFile(fileBuffer, fileName, mimeType);

    // تحديث سجل الدفع
    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: { proofImage: fileUrl },
      include: { student: { include: { user: true } } },
    });

    // تسجيل في Audit Log
    await prisma.auditLog.create({
      data: {
        userId: updated.student.userId,
        action: 'UPLOAD_PROOF',
        targetType: 'Payment',
        targetId: updated.id,
        metadata: { fileUrl },
      },
    });

    return updated;
  }

  // مراجعة الدفع (Admin)
  static async reviewPayment(
    paymentId: string,
    adminUserId: string,
    action: 'APPROVE' | 'REJECT',
    rejectionReason?: string
  ) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        student: true,
        plan: true,
      },
    });
    if (!payment) throw new Error('الدفع غير موجود');
    if (payment.status !== 'PENDING') throw new Error('تمت مراجعة هذا الدفع بالفعل');
    if (!payment.proofImage) throw new Error('لم يتم رفع إثبات الدفع بعد');

    // التحقق من وجود Admin (يتم تمريره من Middleware)
    const admin = await prisma.user.findUnique({
      where: { id: adminUserId, role: 'ADMIN' },
    });
    if (!admin) throw new Error('غير مصرح به');

    const now = new Date();

    if (action === 'APPROVE') {
      // تفعيل الاشتراك
      await SubscriptionService.activateSubscription(
        payment.studentId,
        payment.planId,
        payment.plan.durationDays
      );

      // تحديث حالة الدفع
      const updated = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'APPROVED',
          reviewedById: adminUserId,
          reviewedAt: now,
        },
        include: { student: { include: { user: true } } },
      });

      // تسجيل Audit Log
      await prisma.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'APPROVE_PAYMENT',
          targetType: 'Payment',
          targetId: paymentId,
          metadata: { studentId: payment.studentId, amount: payment.amount },
        },
      });

      return updated;
    } else {
      // REJECT
      const updated = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'REJECTED',
          reviewedById: adminUserId,
          reviewedAt: now,
          rejectionReason: rejectionReason || 'تم رفض الدفع',
        },
        include: { student: { include: { user: true } } },
      });

      await prisma.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'REJECT_PAYMENT',
          targetType: 'Payment',
          targetId: paymentId,
          metadata: { studentId: payment.studentId, reason: rejectionReason },
        },
      });

      return updated;
    }
  }

  // جلب مدفوعات الطالب
  static async getStudentPayments(userId: string) {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw new Error('الطالب غير موجود');

    return prisma.payment.findMany({
      where: { studentId: student.id },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // جلب جميع المدفوعات (للـ Admin) مع خيارات الفلترة
  static async getAllPayments(filters?: {
    status?: PaymentStatus;
    studentId?: string;
    fromDate?: Date;
    toDate?: Date;
  }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.studentId) where.studentId = filters.studentId;
    if (filters?.fromDate) where.createdAt = { gte: filters.fromDate };
    if (filters?.toDate) where.createdAt = { ...where.createdAt, lte: filters.toDate };

    return prisma.payment.findMany({
      where,
      include: {
        student: {
          include: { user: true, grade: true },
        },
        plan: true,
        reviewedBy: {
          select: { fullName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
