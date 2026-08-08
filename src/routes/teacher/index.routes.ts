import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { requireApprovedTeacher } from '../../middlewares/subscription.middleware';
import { TeacherDashboardController } from '../../controllers/teacher-dashboard.controller';
import { GradeController } from '../../controllers/grade.controller';
import { LessonController } from '../../controllers/lesson.controller';
import { AssignmentController } from '../../controllers/assignment.controller';
import { ExamController } from '../../controllers/exam.controller';
import { QuestionController } from '../../controllers/question.controller';

const router = Router();
router.use(authenticate, authorize(['TEACHER']), requireApprovedTeacher);

// ========== لوحة التحكم ==========
router.get('/dashboard', TeacherDashboardController.getDashboard);
router.get('/students', TeacherDashboardController.getStudents);
router.get('/students/:studentId/progress', TeacherDashboardController.getStudentProgress);

// ========== الدروس ==========
router.get('/lessons', LessonController.getTeacherLessons);
router.post('/lessons', LessonController.createLesson);
router.put('/lessons/:id', LessonController.updateLesson);
router.delete('/lessons/:id', LessonController.deleteLesson);
router.post('/lessons/:id/publish', LessonController.publishLesson);
router.post('/lessons/:id/archive', LessonController.archiveLesson);

// ========== الواجبات ==========
router.get('/assignments', AssignmentController.getTeacherAssignments);
router.post('/assignments', AssignmentController.createAssignment);
router.put('/assignments/:id', AssignmentController.updateAssignment);
router.post('/assignments/:id/publish', AssignmentController.publishAssignment);
router.delete('/assignments/:id', AssignmentController.deleteAssignment);
router.get('/assignments/:id/submissions', AssignmentController.getSubmissions);

// ========== الامتحانات ==========
router.get('/exams', ExamController.getTeacherExams);
router.post('/exams', ExamController.createExam);
router.put('/exams/:id', ExamController.updateExam);
router.post('/exams/:id/publish', ExamController.publishExam);
router.delete('/exams/:id', ExamController.deleteExam);
router.get('/exams/:id/attempts', ExamController.getAttempts);

// ========== بنك الأسئلة ==========
router.get('/questions', QuestionController.getTeacherQuestions);
router.post('/questions', QuestionController.createQuestion);
router.put('/questions/:id', QuestionController.updateQuestion);
router.delete('/questions/:id', QuestionController.deleteQuestion);

// ========== التصحيح ==========
router.get('/grading/pending', GradeController.getPendingEssays);
router.post('/grading/answers/:answerId', GradeController.gradeEssay);

export default router;
