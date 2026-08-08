import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import multer from 'multer';

// إعداد Multer للتعامل مع الملفات (سنستخدم memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export class PaymentController {
  // إنشاء طلب دفع جديد
  static async createPayment(req: AuthRequest, res: Response) {
    try {
      const studentId = req.body._studentId; // من middleware
      const { planId, paymentMethod, notes } = req.body;

      const payment = await PaymentService.createPayment({
        studentId,
        planId,
        paymentMethod,
        notes,
      });

      res.status(201).json(payment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // رفع إثبات الدفع
  static async uploadProof(req: AuthRequest, res: Response) {
    try {
      const { paymentId } = req.params;
      const studentId = req.body._studentId;

      if (!req.file) {
        return res.status(400).json({ error: 'يرجى رفع صورة الإثبات' });
      }

      const result = await PaymentService.uploadProof(
        paymentId,
        studentId,
        req.file.buffer,
        req.file.mimetype
      );

      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // جلب مدفوعات الطالب
  static async getMyPayments(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const payments = await PaymentService.getStudentPayments(userId);
      res.json(payments);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // ====== Admin only ======
  // جلب جميع المدفوعات
  static async getAllPayments(req: AuthRequest, res: Response) {
    try {
      const { status, studentId, fromDate, toDate } = req.query;
      const filters: any = {};
      if (status) filters.status = status as any;
      if (studentId) filters.studentId = studentId as string;
      if (fromDate) filters.fromDate = new Date(fromDate as string);
      if (toDate) filters.toDate = new Date(toDate as string);

      const payments = await PaymentService.getAllPayments(filters);
      res.json(payments);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // مراجعة الدفع (قبول/رفض)
  static async reviewPayment(req: AuthRequest, res: Response) {
    try {
      const { paymentId } = req.params;
      const adminUserId = req.user!.userId;
      const { action, rejectionReason } = req.body;

      if (!['APPROVE', 'REJECT'].includes(action)) {
        return res.status(400).json({ error: 'الإجراء غير صحيح' });
      }

      const result = await PaymentService.reviewPayment(
        paymentId,
        adminUserId,
        action,
        rejectionReason
      );

      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

// Middleware Multer للرفع
export const uploadProofMiddleware = upload.single('proofImage');
