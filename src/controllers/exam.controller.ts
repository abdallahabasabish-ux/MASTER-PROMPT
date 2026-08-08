import { Request, Response } from 'express';
import { ExamService } from '../services/exam.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class ExamController {
  static async createExam(req: AuthRequest, res: Response) {
    try {
      const teacherId = req.user!.userId;
      const data = req.body;
      const exam = await ExamService.createExam({ ...data, teacherId });
      res.status(201).json(exam);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async publishExam(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const teacherId = req.user!.userId;
      const result = await ExamService.publishExam(id, teacherId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getStudentExams(req: AuthRequest, res: Response) {
    try {
      const studentId = req.user!.userId;
      const { type } = req.query; // weekly | monthly
      const exams = await ExamService.getPublishedExamsForStudent(studentId, type as any);
      res.json(exams);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getExamForStudent(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const studentId = req.user!.userId;
      const data = await ExamService.getExamForStudent(id, studentId);
      res.json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
