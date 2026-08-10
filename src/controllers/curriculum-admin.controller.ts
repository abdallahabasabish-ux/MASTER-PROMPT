import { Request, Response } from 'express';
import { CurriculumAdminService } from '../services/curriculum-admin.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class CurriculumAdminController {
  // Stages
  static async getStages(req: AuthRequest, res: Response) {
    res.json(await CurriculumAdminService.getAllStages());
  }
  static async createStage(req: AuthRequest, res: Response) {
    res.status(201).json(await CurriculumAdminService.createStage(req.body));
  }
  static async updateStage(req: AuthRequest, res: Response) {
    const { id } = req.params;
    res.json(await CurriculumAdminService.updateStage(id, req.body));
  }
  static async deleteStage(req: AuthRequest, res: Response) {
    const { id } = req.params;
    res.json(await CurriculumAdminService.deleteStage(id));
  }

  // Grades
  static async getGrades(req: AuthRequest, res: Response) {
    const { stageId } = req.query;
    res.json(await CurriculumAdminService.getGradesByStage(stageId as string));
  }
  static async createGrade(req: AuthRequest, res: Response) {
    res.status(201).json(await CurriculumAdminService.createGrade(req.body));
  }
  static async updateGrade(req: AuthRequest, res: Response) {
    const { id } = req.params;
    res.json(await CurriculumAdminService.updateGrade(id, req.body));
  }
  static async deleteGrade(req: AuthRequest, res: Response) {
    const { id } = req.params;
    res.json(await CurriculumAdminService.deleteGrade(id));
  }

  // Terms, Subjects, Units بشكل مشابه
  // ...
}
