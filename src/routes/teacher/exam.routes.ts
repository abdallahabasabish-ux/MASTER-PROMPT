import { Router } from 'express';
import { ExamController } from '../../controllers/exam.controller';
import { ExamAttemptController } from '../../controllers/exam-attempt.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
router.use(authenticate, authorize(['TEACHER']));

// إدارة الامتحانات
router.post('/exams', ExamController.createExam);
router.put('/exams/:id/publish', ExamController.publishExam);
// GET, PUT, DELETE للامتحانات

// تصحيح المقالي
router.post('/exam-answers/:answerId/grade', ExamAttemptController.gradeEssay);

export default router;
