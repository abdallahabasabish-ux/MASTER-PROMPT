import { Router } from 'express';
import { CurriculumController } from '../controllers/curriculum.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// جميع هذه المسارات تتطلب Admin
router.use(authenticate, authorize(['ADMIN']));

router.get('/stages', CurriculumController.getStages);
router.post('/stages', CurriculumController.createStage);
router.put('/stages/:id', CurriculumController.updateStage);
router.delete('/stages/:id', CurriculumController.deleteStage);

// Grades, Terms, Subjects, Units بنفس النمط
// ...

export default router;
