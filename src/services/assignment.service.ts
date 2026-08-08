import { PrismaClient, AssignmentStatus } from '@prisma/client';

const prisma = new PrismaClient();

export class AssignmentService {
  // إنشاء واجب
  static async createAssignment(data: {
    title: string;
    description?: string;
    lessonId: string;
    durationMinutes: number;
    attemptsAllowed: number;
    startDate?: Date;
    endDate?: Date;
    totalMarks: number;
    questionIds: string[]; // ترتيب الأسئلة
    teacherId: string; // userId
  }) {
    const teacher = await prisma.teacher.findUnique({ where: { userId: data.teacherId } });
    if (!teacher || teacher.status !== 'APPROVED') throw new Error('المدرس غير معتمد');

    // التحقق من أن الدرس يخص هذا المدرس
    const lesson = await prisma.lesson.findFirst({
      where: { id: data.lessonId, teacherId: teacher.id },
    });
    if (!lesson) throw new Error('الدرس غير موجود أو لا تملك صلاحية عليه');

    // التحقق من الأسئلة (أنها تخص نفس المدرس)
    const questions = await prisma.question.findMany({
      where: { id: { in: data.questionIds }, teacherId: teacher.id },
    });
    if (questions.length !== data.questionIds.length) {
      throw new Error('بعض الأسئلة غير موجودة أو لا تملك صلاحية عليها');
    }

    // حساب المجموع الفعلي للدرجات
    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

    // إنشاء الواجب
    return prisma.assignment.create({
      data: {
        title: data.title,
        description: data.description,
        lessonId: data.lessonId,
        durationMinutes: data.durationMinutes,
        attemptsAllowed: data.attemptsAllowed,
        startDate: data.startDate,
        endDate: data.endDate,
        totalMarks: totalMarks,
        teacherId: teacher.id,
        status: AssignmentStatus.DRAFT,
        questions: {
          create: data.questionIds.map((qId, idx) => ({
            questionId: qId,
            order: idx,
          })),
        },
      },
      include: {
        questions: { include: { question: { include: { options: true } } } },
        lesson: true,
      },
    });
  }

  // نشر الواجب
  static async publishAssignment(assignmentId: string, teacherId: string) {
    const assignment = await prisma.assignment.findFirst({
      where: { id: assignmentId, teacher: { userId: teacherId } },
    });
    if (!assignment) throw new Error('الواجب غير موجود أو لا تملك صلاحية');
    if (assignment.status === 'PUBLISHED') throw new Error('الواجب منشور بالفعل');

    // يمكن إضافة تحقق من وجود أسئلة
    const count = await prisma.assignmentQuestion.count({ where: { assignmentId } });
    if (count === 0) throw new Error('لا يمكن نشر واجب بدون أسئلة');

    return prisma.assignment.update({
      where: { id: assignmentId },
      data: { status: 'PUBLISHED' },
    });
  }

  // جلب الواجبات المنشورة لطالب
  static async getPublishedAssignmentsForStudent(studentId: string) {
    const student = await prisma.student.findUnique({
      where: { userId: studentId },
      include: { grade: true, term: true },
    });
    if (!student) throw new Error('الطالب غير موجود');
    // التحقق من الاشتراك ...

    return prisma.assignment.findMany({
      where: {
        status: 'PUBLISHED',
        lesson: {
          unit: {
            gradeId: student.gradeId,
            termId: student.termId,
          },
        },
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
        lesson: { include: { unit: true } },
        questions: {
          include: {
            question: {
              include: { options: true },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // جلب واجب محدد للطالب مع إمكانية البدء
  static async getAssignmentForStudent(assignmentId: string, studentId: string) {
    const student = await prisma.student.findUnique({
      where: { userId: studentId },
      include: { grade: true, term: true },
    });
    if (!student) throw new Error('الطالب غير موجود');

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        lesson: { include: { unit: true } },
        questions: {
          include: {
            question: {
              include: { options: true },
            },
          },
          orderBy: { order: 'asc' },
        },
        submissions: {
          where: { studentId: student.id },
          orderBy: { attemptNumber: 'desc' },
          take: 1,
        },
      },
    });
    if (!assignment) throw new Error('الواجب غير موجود');
    if (assignment.status !== 'PUBLISHED') throw new Error('الواجب غير منشور');
    // تحقق من الصف والترم
    if (assignment.lesson.unit.gradeId !== student.gradeId ||
        assignment.lesson.unit.termId !== student.termId) {
      throw new Error('هذا الواجب غير مخصص لصفك');
    }

    // التحقق من عدد المحاولات
    const attemptsCount = await prisma.submission.count({
      where: { assignmentId, studentId: student.id },
    });
    if (attemptsCount >= assignment.attemptsAllowed) {
      throw new Error('لقد استنفدت عدد المحاولات المسموحة');
    }

    // إذا كان هناك محاولة قيد التنفيذ، نعيدها
    const inProgress = await prisma.submission.findFirst({
      where: { assignmentId, studentId: student.id, status: 'IN_PROGRESS' },
    });

    return { assignment, inProgress, attemptsCount };
  }
}
