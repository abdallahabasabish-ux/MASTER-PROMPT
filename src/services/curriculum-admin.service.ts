import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CurriculumAdminService {
  // ========== Stages ==========
  static async getAllStages() {
    return prisma.stage.findMany({
      include: { grades: true },
      orderBy: { order: 'asc' },
    });
  }

  static async createStage(data: { name: string; order: number }) {
    return prisma.stage.create({ data });
  }

  static async updateStage(id: string, data: { name?: string; order?: number }) {
    return prisma.stage.update({ where: { id }, data });
  }

  static async deleteStage(id: string) {
    const grades = await prisma.grade.count({ where: { stageId: id } });
    if (grades > 0) throw new Error('لا يمكن حذف المرحلة لأنها تحتوي على صفوف');
    return prisma.stage.delete({ where: { id } });
  }

  // ========== Grades ==========
  static async getGradesByStage(stageId?: string) {
    const where = stageId ? { stageId } : {};
    return prisma.grade.findMany({
      where,
      include: { stage: true },
      orderBy: { order: 'asc' },
    });
  }

  static async createGrade(data: { name: string; order: number; stageId: string }) {
    return prisma.grade.create({ data });
  }

  static async updateGrade(id: string, data: { name?: string; order?: number; stageId?: string }) {
    return prisma.grade.update({ where: { id }, data });
  }

  static async deleteGrade(id: string) {
    // التحقق من عدم وجود وحدات أو طلاب مرتبطين
    const units = await prisma.unit.count({ where: { gradeId: id } });
    if (units > 0) throw new Error('لا يمكن حذف الصف لأنه يحتوي على وحدات');
    const students = await prisma.student.count({ where: { gradeId: id } });
    if (students > 0) throw new Error('لا يمكن حذف الصف لأنه يحتوي على طلاب');
    return prisma.grade.delete({ where: { id } });
  }

  // ========== Terms ==========
  static async getAllTerms() {
    return prisma.term.findMany({ orderBy: { order: 'asc' } });
  }

  static async createTerm(data: { name: string; order: number }) {
    return prisma.term.create({ data });
  }

  static async updateTerm(id: string, data: { name?: string; order?: number }) {
    return prisma.term.update({ where: { id }, data });
  }

  static async deleteTerm(id: string) {
    return prisma.term.delete({ where: { id } });
  }

  // ========== Subjects ==========
  static async getSubjectsByGrade(gradeId?: string) {
    const where = gradeId ? { gradeId } : {};
    return prisma.subject.findMany({
      where,
      include: { grade: true },
      orderBy: { name: 'asc' },
    });
  }

  static async createSubject(data: { name: string; code?: string; gradeId: string }) {
    return prisma.subject.create({ data });
  }

  static async updateSubject(id: string, data: { name?: string; code?: string; gradeId?: string }) {
    return prisma.subject.update({ where: { id }, data });
  }

  static async deleteSubject(id: string) {
    const units = await prisma.unit.count({ where: { subjectId: id } });
    if (units > 0) throw new Error('لا يمكن حذف المادة لأنها تحتوي على وحدات');
    return prisma.subject.delete({ where: { id } });
  }

  // ========== Units ==========
  static async getUnits(filters?: { gradeId?: string; subjectId?: string; termId?: string }) {
    const where: any = {};
    if (filters?.gradeId) where.gradeId = filters.gradeId;
    if (filters?.subjectId) where.subjectId = filters.subjectId;
    if (filters?.termId) where.termId = filters.termId;

    return prisma.unit.findMany({
      where,
      include: { grade: true, subject: true, term: true },
      orderBy: { order: 'asc' },
    });
  }

  static async createUnit(data: {
    name: string;
    order: number;
    gradeId: string;
    subjectId: string;
    termId: string;
  }) {
    return prisma.unit.create({ data });
  }

  static async updateUnit(id: string, data: { name?: string; order?: number; gradeId?: string; subjectId?: string; termId?: string }) {
    return prisma.unit.update({ where: { id }, data });
  }

  static async deleteUnit(id: string) {
    const lessons = await prisma.lesson.count({ where: { unitId: id } });
    if (lessons > 0) throw new Error('لا يمكن حذف الوحدة لأنها تحتوي على دروس');
    return prisma.unit.delete({ where: { id } });
  }
}
