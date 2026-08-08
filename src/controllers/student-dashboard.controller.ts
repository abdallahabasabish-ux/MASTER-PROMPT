import { Request, Response } from 'express';
import { ProgressService } from '../services/progress.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class StudentDashboardController {
  // لوحة التحكم الرئيسية
  static async getDashboard(req: AuthRequest, res: Response) {
    try {
      const studentId = req.user!.userId;
      const data = await ProgressService.getStudentDashboard(studentId);
      res.json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // تحديث تقدم الفيديو
  static async updateVideoProgress(req: AuthRequest, res: Response) {
    try {
      const { videoId } = req.params;
      const { progress, position } = req.body;
      const studentId = req.user!.userId;
      const result = await ProgressService.updateVideoProgress(studentId, videoId, progress, position);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // تحديد مشاهدة المحتوى النصي
  static async markContentViewed(req: AuthRequest, res: Response) {
    try {
      const { lessonId } = req.params;
      const studentId = req.user!.userId;
      await ProgressService.markContentViewed(studentId, lessonId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // جلب تقدم المنهج
  static async getCurriculumProgress(req: AuthRequest, res: Response) {
    try {
      const studentId = req.user!.userId;
      const { gradeId } = req.query;
      const data = await ProgressService.getStudentCurriculumProgress(studentId, gradeId as string);
      res.json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
