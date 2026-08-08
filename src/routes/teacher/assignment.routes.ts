import { Router } from 'express';
import { AssignmentController } from '../../controllers/assignment.controller';
import { SubmissionController } from '../../controllers/submission.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
router.use(authenticate, authorize(['TEACHER']));

// إدارة الواجبات
router.post('/assignments', AssignmentController.createAssignment);
router.put('/assignments/:id/publish', AssignmentController.publishAssignment);
// يمكن إضافة GET, PUT, DELETE

// تصحيح الإجابات المقالية
router.post('/answers/:answerId/grade', SubmissionController.gradeEssay);

export default router;
