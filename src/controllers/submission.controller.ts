import { Request, Response } from 'express';
import { SubmissionService } from '../services/submission.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class SubmissionController {
  static async startAttempt(req: AuthRequest, res: Response) {
    try {
      const { assignmentId } = req.params;
      const studentId = req.user!.userId;
      const submission = await SubmissionService.startAttempt(assignmentId, studentId);
      res.json(submission);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async submitAttempt(req: AuthRequest, res: Response) {
    try {
      const { submissionId } = req.params;
      const studentId = req.user!.userId;
      const { answers } = req.body;
      const result = await SubmissionService.submitAttempt(submissionId, studentId, answers);
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
      const result = await SubmissionService.gradeEssayAnswer(answerId, teacherId, marksAwarded);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
