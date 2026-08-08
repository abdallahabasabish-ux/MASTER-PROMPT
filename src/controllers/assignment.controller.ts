import { Request, Response } from 'express';
import { AssignmentService } from '../services/assignment.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class AssignmentController {
  static async createAssignment(req: AuthRequest, res: Response) {
    try {
      const teacherId = req.user!.userId;
      const data = req.body;
      const assignment = await AssignmentService.createAssignment({ ...data, teacherId });
      res.status(201).json(assignment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async publishAssignment(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const teacherId = req.user!.userId;
      const result = await AssignmentService.publishAssignment(id, teacherId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getStudentAssignments(req: AuthRequest, res: Response) {
    try {
      const studentId = req.user!.userId;
      const assignments = await AssignmentService.getPublishedAssignmentsForStudent(studentId);
      res.json(assignments);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getAssignmentForStudent(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const studentId = req.user!.userId;
      const data = await AssignmentService.getAssignmentForStudent(id, studentId);
      res.json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
