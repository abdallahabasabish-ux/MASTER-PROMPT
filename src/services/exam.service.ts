import { PrismaClient, ExamStatus, ExamType } from '@prisma/client';

const prisma = new PrismaClient();

export class ExamService {
  // إنشاء امتحان (مدرس معتمد)
  static async createExam(data: {
    title: string;
    description?: string;
    type: ExamType;
    gradeId: string;
    unitId?: string;
    durationMinutes: number;
    totalMarks?: number;
    startDate?: Date;
    endDate?: Date;
    attemptsAllowed?: number;
    questionIds: string[]; // ترتيب الأسئلة
    teacherId: string; // userId
  }) {
    const teacher = await prisma.teacher.findUnique({ where: { userId: data.teacherId } });
    if (!teacher || teacher.status !== 'APPROVED') throw new Error('المدرس غير معتمد');

    // التحقق من الصف والوحدة
    const grade = await prisma.grade.findUnique({ where: { id: data.gradeId } });
    if (!grade) throw new Error('الصف غير موجود');

    if (data.unitId) {
      const unit = await prisma.unit.findFirst({
        where: { id: data.unitId, gradeId: data.gradeId },
      });
      if (!unit) throw new Error('الوحدة غير موجودة أو لا تنتمي للصف المحدد');
    }

    // التحقق من الأسئلة (أنها تخص نفس المدرس ونفس الصف)
    const questions = await prisma.question.findMany({
      where: {
        id: { in: data.questionIds },
        teacherId: teacher.id,
        gradeId: data.gradeId,
      },
    });
    if (questions.length !== data.questionIds.length) {
      throw new Error('بعض الأسئلة غير موجودة أو لا تنتمي لهذا الصف');
    }

    // حساب المجموع
    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

    // إنشاء الامتحان
    return prisma.exam.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        gradeId: data.gradeId,
        unitId: data.unitId,
        durationMinutes: data.durationMinutes,
        totalMarks: totalMarks,
        startDate: data.startDate,
        endDate: data.endDate,
        attemptsAllowed: data.attemptsAllowed || 1,
        teacherId: teacher.id,
        status: ExamStatus.DRAFT,
        questions: {
          create: data.questionIds.map((qId, idx) => ({
            questionId: qId,
            order: idx,
          })),
        },
      },
      include: {
        questions: { include: { question: { include: { options: true } } } },
        grade: true,
        unit: true,
      },
    });
  }

  // نشر الامتحان
  static async publishExam(examId: string, teacherId: string) {
    const exam = await prisma.exam.findFirst({
      where: { id: examId, teacher: { userId: teacherId } },
    });
    if (!exam) throw new Error('الامتحان غير موجود أو لا تملك صلاحية');
    if (exam.status === 'PUBLISHED') throw new Error('الامتحان منشور بالفعل');

    const count = await prisma.examQuestion.count({ where: { examId } });
    if (count === 0) throw new Error('لا يمكن نشر امتحان بدون أسئلة');

    return prisma.exam.update({
      where: { id: examId },
      data: { status: 'PUBLISHED' },
    });
  }

  // جلب الامتحانات المنشورة لطالب
  static async getPublishedExamsForStudent(studentId: string, type?: ExamType) {
    const student = await prisma.student.findUnique({
      where: { userId: studentId },
      include: { grade: true, term: true },
    });
    if (!student) throw new Error('الطالب غير موجود');
    // التحقق من الاشتراك ...

    return prisma.exam.findMany({
      where: {
        status: 'PUBLISHED',
        gradeId: student.gradeId,
        ...(type && { type }),
        OR: [
          { startDate: null },
          { startDate: { lte: new Date() } },
        ],
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } },
        ],
      },
      include: {
        grade: true,
        unit: true,
        questions: {
          include: {
            question: {
              include: { options: true },
            },
          },
          orderBy: { order: 'asc' },
        },
        attempts: {
          where: { studentId: student.id },
          orderBy: { attemptNumber: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // جلب امتحان محدد للطالب مع إمكانية البدء
  static async getExamForStudent(examId: string, studentId: string) {
    const student = await prisma.student.findUnique({
      where: { userId: studentId },
    });
    if (!student) throw new Error('الطالب غير موجود');

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        grade: true,
        unit: true,
        questions: {
          include: {
            question: {
              include: { options: true },
            },
          },
          orderBy: { order: 'asc' },
        },
        attempts: {
          where: { studentId: student.id },
          orderBy: { attemptNumber: 'desc' },
        },
      },
    });
    if (!exam) throw new Error('الامتحان غير موجود');
    if (exam.status !== 'PUBLISHED') throw new Error('الامتحان غير منشور');
    if (exam.gradeId !== student.gradeId) throw new Error('هذا الامتحان غير مخصص لصفك');

    // التحقق من التاريخ
    const now = new Date();
    if (exam.startDate && exam.startDate > now) {
      throw new Error('لم يحن موعد الامتحان بعد');
    }
    if (exam.endDate && exam.endDate < now) {
      throw new Error('انتهت فترة الامتحان');
    }

    // التحقق من عدد المحاولات
    const attemptsCount = exam.attempts.length;
    if (attemptsCount >= exam.attemptsAllowed) {
      throw new Error('لقد استنفدت عدد المحاولات المسموحة');
    }

    // التحقق من وجود محاولة قيد التنفيذ
    const inProgress = exam.attempts.find(a => a.status === 'IN_PROGRESS');

    return { exam, inProgress, attemptsCount };
  }
}
