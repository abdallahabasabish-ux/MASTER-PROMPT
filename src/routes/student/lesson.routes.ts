import { Router } from 'express';
import { LessonController } from '../../controllers/lesson.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { requireActiveSubscription } from '../../middlewares/subscription.middleware';

const router = Router();
router.use(authenticate, authorize(['STUDENT']));

// جميع مسارات المحتوى محمية بالاشتراك النشط
router.get('/lessons', requireActiveSubscription, LessonController.getLessonsForStudent);
router.get('/lessons/:id', requireActiveSubscription, LessonController.getLessonForStudent);

export default router;
