import { Request, Response } from 'express';
import { ExamAttemptService } from '../services/exam-attempt.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class ExamAttemptController {
  static async startAttempt(req: AuthRequest, res: Response) {
    try {
      const { examId } = req.params;
      const studentId = req.user!.userId;
      const attempt = await ExamAttemptService.startAttempt(examId, studentId);
      res.json(attempt);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async updateQuestionState(req: AuthRequest, res: Response) {
    try {
      const { attemptId, questionId } = req.params;
      const { state } = req.body; // answered | unanswered | marked
      const studentId = req.user!.userId;
      const result = await ExamAttemptService.updateQuestionState(attemptId, studentId, questionId, state);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async saveAnswer(req: AuthRequest, res: Response) {
    try {
      const { attemptId, questionId } = req.params;
      const studentId = req.user!.userId;
      const { answer } = req.body;
      const result = await ExamAttemptService.saveAnswer(attemptId, studentId, questionId, answer);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async submitAttempt(req: AuthRequest, res: Response) {
    try {
      const { attemptId } = req.params;
      const studentId = req.user!.userId;
      const { answers } = req.body; // القائمة النهائية للإجابات
      const result = await ExamAttemptService.submitAttempt(attemptId, studentId, answers);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async gradeEssay(req: AuthRequest, res: Response) {
    try {
      const { answerId } = req.params;
      const teacherId = req.user!.userId;
      const { marksAwarded } = req.body;
      const result = await ExamAttemptService.gradeEssayAnswer(answerId, teacherId, marksAwarded);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
