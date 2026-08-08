import { Router } from 'express';
import { StudentDashboardController } from '../../controllers/student-dashboard.controller';
import { StudentProfileController } from '../../controllers/student-profile.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();
router.use(authenticate, authorize(['STUDENT']));

// لوحة التحكم
router.get('/dashboard', StudentDashboardController.getDashboard);

// التقدم
router.get('/progress/curriculum', StudentDashboardController.getCurriculumProgress);
router.put('/videos/:videoId/progress', StudentDashboardController.updateVideoProgress);
router.post('/lessons/:lessonId/content-viewed', StudentDashboardController.markContentViewed);

// الملف الشخصي
router.get('/profile', StudentProfileController.getProfile);
router.put('/profile', StudentProfileController.updateProfile);
router.get('/results', StudentProfileController.getResults);

export default router;
