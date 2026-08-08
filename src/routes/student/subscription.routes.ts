import { Router } from 'express';
import { PaymentController } from '../../controllers/payment.controller';
import { SubscriptionController } from '../../controllers/subscription.controller'; // سننشئه
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { requireActiveSubscription } from '../../middlewares/subscription.middleware';
import { uploadProofMiddleware } from '../../controllers/payment.controller';

const router = Router();
router.use(authenticate, authorize(['STUDENT']));

// خطط الاشتراك
router.get('/plans', SubscriptionController.getPlans);

// حالة الاشتراك الحالية
router.get('/status', SubscriptionController.getStatus);

// إنشاء طلب دفع
router.post('/payments', requireActiveSubscription, PaymentController.createPayment);

// رفع إثبات الدفع
router.post(
  '/payments/:paymentId/proof',
  requireActiveSubscription,
  uploadProofMiddleware,
  PaymentController.uploadProof
);

// عرض مدفوعاتي
router.get('/payments', PaymentController.getMyPayments);

export default router;
