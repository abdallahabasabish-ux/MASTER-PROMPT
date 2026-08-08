import { Router } from 'express';
import { PaymentController } from '../../controllers/payment.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
router.use(authenticate, authorize(['ADMIN']));

// عرض جميع المدفوعات
router.get('/payments', PaymentController.getAllPayments);

// مراجعة الدفع (قبول/رفض)
router.put('/payments/:paymentId/review', PaymentController.reviewPayment);

export default router;
