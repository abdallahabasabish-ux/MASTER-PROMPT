import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CurriculumService {
  // Stages
  static async getAllStages() {
    return prisma.stage.findMany({ orderBy: { order: 'asc' } });
  }

  static async createStage(data: { name: string; order: number }) {
    return prisma.stage.create({ data });
  }

  static async updateStage(id: string, data: { name?: string; order?: number }) {
    return prisma.stage.update({ where: { id }, data });
  }

  static async deleteStage(id: string) {
    // التحقق من عدم وجود صفوف تابعة
    const grades = await prisma.grade.count({ where: { stageId: id } });
    if (grades > 0) throw new Error('لا يمكن حذف المرحلة لأنها تحتوي على صفوف');
    return prisma.stage.delete({ where: { id } });
  }

  // Grades
  static async getGradesByStage(stageId: string) {
    return prisma.grade.findMany({ where: { stageId }, orderBy: { order: 'asc' } });
  }

  static async createGrade(data: { name: string; order: number; stageId: string }) {
    return prisma.grade.create({ data });
  }

  // ... وكذلك لـ Terms, Subjects, Units (بنفس النمط)
  // أختصر هنا، لكن في التطبيق الفعلي أكتب لكل كيان CRUD كامل مع التحقق من الصلاحيات.
}
