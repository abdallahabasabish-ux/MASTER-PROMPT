import { Response } from 'express';
import { GradeService } from '../services/grade.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class GradeController {
  static async getPendingEssays(req: AuthRequest, res: Response) {
    try {
      const teacherId = req.user!.userId;
      const { type } = req.query; // 'assignment' | 'exam'
      const answers = await GradeService.getPendingEssayAnswers(
        teacherId,
        type as 'assignment' | 'exam' || 'assignment'
      );
      res.json(answers);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async gradeEssay(req: AuthRequest, res: Response) {
    try {
      const teacherId = req.user!.userId;
      const { answerId } = req.params;
      const { marksAwarded, feedback } = req.body;

      if (marksAwarded === undefined || marksAwarded < 0) {
        return res.status(400).json({ error: 'الرجاء إدخال درجة صحيحة' });
      }

      const result = await GradeService.gradeEssayAnswer(
        answerId,
        teacherId,
        marksAwarded,
        feedback
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
