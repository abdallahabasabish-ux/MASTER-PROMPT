import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { AdminDashboardController } from '../../controllers/admin-dashboard.controller';
import { AdminTeacherController } from '../../controllers/admin-teacher.controller';
import { AdminStudentController } from '../../controllers/admin-student.controller';
import { AuditLogController } from '../../controllers/audit-log.controller';
import { CurriculumAdminController } from '../../controllers/curriculum-admin.controller';
import { PaymentController } from '../../controllers/payment.controller';

const router = Router();
router.use(authenticate, authorize(['ADMIN']));

// ========== Dashboard ==========
router.get('/stats', AdminDashboardController.getStats);
router.get('/stats/revenue', AdminDashboardController.getMonthlyRevenue);
router.get('/stats/registrations', AdminDashboardController.getMonthlyRegistrations);

// ========== Teachers ==========
router.get('/teachers', AdminTeacherController.getTeachers);
router.get('/teachers/:id', AdminTeacherController.getTeacherDetails);
router.put('/teachers/:id/status', AdminTeacherController.updateTeacherStatus);
router.delete('/teachers/:id', AdminTeacherController.deleteTeacher);

// ========== Students ==========
router.get('/students', AdminStudentController.getStudents);
router.get('/students/:id', AdminStudentController.getStudentDetails);
router.put('/students/:id/status', AdminStudentController.updateStudentStatus);

// ========== Payments ==========
router.get('/payments', PaymentController.getAllPayments);
router.put('/payments/:id/review', PaymentController.reviewPayment);

// ========== Curriculum ==========
// Stages
router.get('/curriculum/stages', CurriculumAdminController.getStages);
router.post('/curriculum/stages', CurriculumAdminController.createStage);
router.put('/curriculum/stages/:id', CurriculumAdminController.updateStage);
router.delete('/curriculum/stages/:id', CurriculumAdminController.deleteStage);
// Grades, Terms, Subjects, Units بشكل مشابه

// ========== Audit Logs ==========
router.get('/audit-logs', AuditLogController.getLogs);
router.get('/audit-logs/actions', AuditLogController.getActions);
router.get('/audit-logs/target-types', AuditLogController.getTargetTypes);

// ========== Settings ==========
router.get('/settings', SettingsController.getSettings);
router.put('/settings', SettingsController.updateSettings);

export default router;
