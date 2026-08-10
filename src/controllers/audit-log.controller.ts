import { Request, Response } from 'express';
import { AuditLogService } from '../services/audit-log.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class AuditLogController {
  static async getLogs(req: AuthRequest, res: Response) {
    try {
      const { userId, action, targetType, fromDate, toDate, page, limit } = req.query;
      const data = await AuditLogService.getLogs({
        userId: userId as string,
        action: action as string,
        targetType: targetType as string,
        fromDate: fromDate ? new Date(fromDate as string) : undefined,
        toDate: toDate ? new Date(toDate as string) : undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });
      res.json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getActions(req: AuthRequest, res: Response) {
    try {
      const actions = await AuditLogService.getDistinctActions();
      res.json(actions);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getTargetTypes(req: AuthRequest, res: Response) {
    try {
      const types = await AuditLogService.getDistinctTargetTypes();
      res.json(types);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
