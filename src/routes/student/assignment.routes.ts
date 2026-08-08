import { Router } from 'express';
import { AssignmentController } from '../../controllers/assignment.controller';
import { SubmissionController } from '../../controllers/submission.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
router.use(authenticate, authorize(['STUDENT']));

// عرض الواجبات
router.get('/assignments', AssignmentController.getStudentAssignments);
router.get('/assignments/:id', AssignmentController.getAssignmentForStudent);

// بدء المحاولة
router.post('/assignments/:assignmentId/start', SubmissionController.startAttempt);

// تقديم المحاولة (مع الإجابات)
router.post('/submissions/:submissionId/submit', SubmissionController.submitAttempt);

export default router;
