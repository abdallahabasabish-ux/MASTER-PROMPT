import { Response } from 'express';
import { TeacherDashboardService } from '../services/teacher-dashboard.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class TeacherDashboardController {
  static async getDashboard(req: AuthRequest, res: Response) {
    try {
      const teacherId = req.user!.userId;
      const data = await TeacherDashboardService.getDashboardStats(teacherId);
      res.json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getStudents(req: AuthRequest, res: Response) {
    try {
      const teacherId = req.user!.userId;
      const { gradeId } = req.query;
      const students = await TeacherDashboardService.getTeacherStudents(
        teacherId,
        gradeId as string
      );
      res.json(students);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getStudentProgress(req: AuthRequest, res: Response) {
    try {
      const teacherId = req.user!.userId;
      const { studentId } = req.params;
      const data = await TeacherDashboardService.getStudentProgress(teacherId, studentId);
      res.json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
