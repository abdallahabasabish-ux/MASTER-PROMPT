import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

export class StudentProfileController {
  static async getProfile(req: AuthRequest, res: Response) {
    try {
      const studentId = req.user!.userId;
      const student = await prisma.student.findUnique({
        where: { userId: studentId },
        include: {
          user: true,
          grade: { include: { stage: true } },
          term: true,
          stats: true,
        },
      });
      if (!student) throw new Error('الطالب غير موجود');
      res.json(student);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      const studentId = req.user!.userId;
      const { fullName, phone, parentPhone } = req.body;
      
      // تحديث المستخدم
      await prisma.user.update({
        where: { id: studentId },
        data: { fullName, phone },
      });

      // تحديث الطالب
      const updated = await prisma.student.update({
        where: { userId: studentId },
        data: { parentPhone },
        include: { user: true },
      });

      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // جلب سجل النتائج
  static async getResults(req: AuthRequest, res: Response) {
    try {
      const studentId = req.user!.userId;
      const student = await prisma.student.findUnique({ where: { userId: studentId } });
      if (!student) throw new Error('الطالب غير موجود');

      const results = await prisma.result.findMany({
        where: { studentId: student.id },
        include: {
          submission: {
            include: {
              assignment: { include: { lesson: true } },
            },
          },
          examAttempt: {
            include: {
              exam: { include: { grade: true, unit: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // تنسيق النتائج لعرضها
      const formatted = results.map(r => {
        let title = '';
        let type = '';
        if (r.submission) {
          title = r.submission.assignment.title;
          type = 'واجب';
        } else if (r.examAttempt) {
          title = r.examAttempt.exam.title;
          type = r.examAttempt.exam.type === 'WEEKLY' ? 'امتحان أسبوعي' : 'امتحان شهري';
        }
        return {
          id: r.id,
          title,
          type,
          obtainedMarks: r.obtainedMarks,
          totalMarks: r.totalMarks,
          percentage: r.percentage,
          status: r.status,
          gradedAt: r.gradedAt,
          createdAt: r.createdAt,
        };
      });

      res.json(formatted);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
