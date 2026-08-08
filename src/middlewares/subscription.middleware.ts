import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from './auth.middleware';

const prisma = new PrismaClient();

export const requireActiveSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'غير مصرح به' });
    }

    // جلب الطالب مع حالة الاشتراك
    const student = await prisma.student.findUnique({
      where: { userId },
      select: {
        id: true,
        subscriptionStatus: true,
        subscriptionEnd: true,
      },
    });

    if (!student) {
      return res.status(403).json({ error: 'حساب الطالب غير مكتمل' });
    }

    // التحقق من الحالة
    if (student.subscriptionStatus === 'SUSPENDED') {
      return res.status(403).json({ error: 'حسابك معلق، يرجى التواصل مع الدعم' });
    }

    if (student.subscriptionStatus === 'EXPIRED' || student.subscriptionStatus === 'PENDING') {
      return res.status(403).json({ error: 'اشتراكك غير نشط. يرجى تجديد الاشتراك للوصول إلى المحتوى.' });
    }

    if (student.subscriptionStatus === 'ACTIVE') {
      // التحقق من تاريخ الانتهاء (للتأكد من عدم انتهائه في الخلفية دون تحديث الحالة)
      if (student.subscriptionEnd && new Date(student.subscriptionEnd) < new Date()) {
        // تحديث الحالة إلى EXPIRED
        await prisma.student.update({
          where: { id: student.id },
          data: { subscriptionStatus: 'EXPIRED' },
        });
        return res.status(403).json({ error: 'انتهت صلاحية اشتراكك. يرجى التجديد.' });
      }
    }

    // إضافة معرف الطالب للاستخدام في الـ Controllers
    req.body._studentId = student.id;
    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    return res.status(500).json({ error: 'حدث خطأ في التحقق من الاشتراك' });
  }
};

// Middleware للتحقق من صلاحية المدرس (معتمد)
export const requireApprovedTeacher = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'غير مصرح به' });

    const teacher = await prisma.teacher.findUnique({
      where: { userId },
      select: { status: true, id: true },
    });

    if (!teacher || teacher.status !== 'APPROVED') {
      return res.status(403).json({ error: 'حساب المدرس غير معتمد أو غير موجود' });
    }

    req.body._teacherId = teacher.id;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'حدث خطأ في التحقق من صلاحية المدرس' });
  }
};
