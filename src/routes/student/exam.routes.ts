// 
import { Router } from 'express';
import { ExamController } from '../../controllers/exam.controller';
import { ExamAttemptController } from '../../controllers/exam-attempt.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
router.use(authenticate, authorize(['STUDENT']));

// عرض الامتحانات
router.get('/exams', ExamController.getStudentExams);
router.get('/exams/:id', ExamController.getExamForStudent);

// بدء المحاولة
router.post('/exams/:examId/start', ExamAttemptController.startAttempt);

// حفظ تقدم (إجابة مؤقتة)
router.put('/attempts/:attemptId/questions/:questionId/save', ExamAttemptController.saveAnswer);

// تحديث حالة سؤال (answered/marked)
router.put('/attempts/:attemptId/questions/:questionId/state', ExamAttemptController.updateQuestionState);

// تقديم الامتحان
router.post('/attempts/:attemptId/submit', ExamAttemptController.submitAttempt);

export default router;
