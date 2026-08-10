import { Request, Response } from 'express';
import { AdminStatsService } from '../services/admin-stats.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class AdminDashboardController {
  static async getStats(req: AuthRequest, res: Response) {
    try {
      const stats = await AdminStatsService.getDashboardStats();
      res.json(stats);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getMonthlyRevenue(req: AuthRequest, res: Response) {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const data = await AdminStatsService.getMonthlyRevenue(year);
      res.json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getMonthlyRegistrations(req: AuthRequest, res: Response) {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const data = await AdminStatsService.getMonthlyRegistrations(year);
      res.json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
