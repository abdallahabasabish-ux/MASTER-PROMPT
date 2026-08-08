import { PrismaClient, QuestionType, Difficulty } from '@prisma/client';

const prisma = new PrismaClient();

export class QuestionService {
  // إنشاء سؤال (للمدرس المعتمد)
  static async createQuestion(data: {
    type: QuestionType;
    difficulty: Difficulty;
    questionText: string;
    marks: number;
    stageId?: string;
    gradeId?: string;
    termId?: string;
    unitId?: string;
    lessonId?: string;
    teacherId: string; // userId
    options?: { optionText: string; isCorrect: boolean; order: number }[];
  }) {
    const teacher = await prisma.teacher.findUnique({ where: { userId: data.teacherId } });
    if (!teacher || teacher.status !== 'APPROVED') throw new Error('المدرس غير معتمد');

    return prisma.question.create({
      data: {
        type: data.type,
        difficulty: data.difficulty,
        questionText: data.questionText,
        marks: data.marks,
        stageId: data.stageId,
        gradeId: data.gradeId,
        termId: data.termId,
        unitId: data.unitId,
        lessonId: data.lessonId,
        teacherId: teacher.id,
        options: data.options
          ? { create: data.options.map(o => ({ optionText: o.optionText, isCorrect: o.isCorrect, order: o.order })) }
          : undefined,
      },
      include: { options: true },
    });
  }

  // جلب الأسئلة المتاحة للمدرس (مع تصفية حسب الصف/المادة)
  static async getQuestionsForTeacher(teacherId: string, filters?: { gradeId?: string; unitId?: string; type?: QuestionType }) {
    const teacher = await prisma.teacher.findUnique({ where: { userId: teacherId } });
    if (!teacher) throw new Error('المدرس غير موجود');

    return prisma.question.findMany({
      where: {
        teacherId: teacher.id,
        ...(filters?.gradeId && { gradeId: filters.gradeId }),
        ...(filters?.unitId && { unitId: filters.unitId }),
        ...(filters?.type && { type: filters.type }),
      },
      include: { options: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ... تحديث، حذف، جلب سؤال محدد
}
