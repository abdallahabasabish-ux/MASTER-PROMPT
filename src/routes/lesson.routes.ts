import { Router } from 'express';
import { LessonController } from '../controllers/lesson.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// مسارات للمدرسين (معتمد)
router.use('/teacher', authenticate, authorize(['TEACHER']));
router.post('/teacher/lessons', LessonController.createLesson);
router.put('/teacher/lessons/:id', LessonController.updateLesson);
router.post('/teacher/lessons/:id/publish', LessonController.publishLesson);
router.post('/teacher/lessons/:id/archive', LessonController.archiveLesson);
// يمكن إضافة DELETE

// مسارات للطلاب (معتمد على الاشتراك)
router.use('/student', authenticate, authorize(['STUDENT']));
router.get('/student/lessons', LessonController.getLessonsForStudent);
router.get('/student/lessons/:id', LessonController.getLessonForStudent);

export default router;
