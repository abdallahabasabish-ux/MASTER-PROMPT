import { Request, Response } from 'express';
import { AdminTeacherService } from '../services/admin-teacher.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class AdminTeacherController {
  static async getTeachers(req: AuthRequest, res: Response) {
    try {
      const { status, search, page, limit } = req.query;
      const data = await AdminTeacherService.getTeachers({
        status: status as string,
        search: search as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getTeacherDetails(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const data = await AdminTeacherService.getTeacherDetails(id);
      res.json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async updateTeacherStatus(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      const adminUserId = req.user!.userId;
      const result = await AdminTeacherService.updateTeacherStatus(id, status, adminUserId, reason);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async deleteTeacher(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const adminUserId = req.user!.userId;
      const result = await AdminTeacherService.deleteTeacher(id, adminUserId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
