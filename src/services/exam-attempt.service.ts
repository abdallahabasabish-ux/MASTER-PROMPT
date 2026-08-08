import { PrismaClient, ExamAttemptStatus } from '@prisma/client';

const prisma = new PrismaClient();

export class ExamAttemptService {
  // بدء محاولة جديدة
  static async startAttempt(examId: string, studentId: string) {
    const student = await prisma.student.findUnique({ where: { userId: studentId } });
    if (!student) throw new Error('الطالب غير موجود');

    // التحقق من محاولة قيد التنفيذ
    const existing = await prisma.examAttempt.findFirst({
      where: { examId, studentId: student.id, status: 'IN_PROGRESS' },
    });
    if (existing) return existing;

    // التحقق من عدد المحاولات
    const count = await prisma.examAttempt.count({
      where: { examId, studentId: student.id },
    });
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new Error('الامتحان غير موجود');
    if (count >= exam.attemptsAllowed) {
      throw new Error('لقد استنفدت عدد المحاولات المسموحة');
    }

    // إنشاء محاولة جديدة مع حالة أولية للأسئلة
    const questions = await prisma.examQuestion.findMany({
      where: { examId },
      select: { questionId: true },
      orderBy: { order: 'asc' },
    });

    const initialState: Record<string, string> = {};
    questions.forEach((q, idx) => {
      initialState[q.questionId] = 'unanswered';
    });

    return prisma.examAttempt.create({
      data: {
        examId,
        studentId: student.id,
        attemptNumber: count + 1,
        startedAt: new Date(),
        status: 'IN_PROGRESS',
        questionsState: initialState,
      },
      include: {
        exam: {
          include: {
            questions: {
              include: { question: { include: { options: true } } },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });
  }

  // تحديث حالة سؤال (Mark for Review أو Answered/Unanswered)
  static async updateQuestionState(attemptId: string, studentId: string, questionId: string, state: 'answered' | 'unanswered' | 'marked') {
    const attempt = await prisma.examAttempt.findFirst({
      where: { id: attemptId, student: { userId: studentId } },
    });
    if (!attempt) throw new Error('المحاولة غير موجودة');
    if (attempt.status !== 'IN_PROGRESS') throw new Error('لا يمكن التعديل بعد التسليم');

    const questionsState = (attempt.questionsState as Record<string, string>) || {};
    questionsState[questionId] = state;

    return prisma.examAttempt.update({
      where: { id: attemptId },
      data: { questionsState },
    });
  }

  // حفظ إجابة مؤقتة (دون تقديم) - للحفاظ على التقدم
  static async saveAnswer(attemptId: string, studentId: string, questionId: string, answer: any) {
    const attempt = await prisma.examAttempt.findFirst({
      where: { id: attemptId, student: { userId: studentId } },
    });
    if (!attempt) throw new Error('المحاولة غير موجودة');
    if (attempt.status !== 'IN_PROGRESS') throw new Error('لا يمكن التعديل بعد التسليم');

    // حذف الإجابة القديمة إن وجدت
    await prisma.examAnswer.deleteMany({
      where: { attemptId, questionId },
    });

    // إنشاء إجابة جديدة (مؤقتة)
    return prisma.examAnswer.create({
      data: {
        attemptId,
        questionId,
        answerText: answer.answerText,
        answerJson: answer.answerJson,
      },
    });
  }

  // تقديم الامتحان رسمياً
  static async submitAttempt(attemptId: string, studentId: string, finalAnswers?: any[]) {
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        student: true,
        exam: {
          include: {
            questions: {
              include: {
                question: {
                  include: { options: true },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
        },
        answers: true,
      },
    });
    if (!attempt) throw new Error('المحاولة غير موجودة');
    if (attempt.student.userId !== studentId) throw new Error('ليس لديك صلاحية');
    if (attempt.status !== 'IN_PROGRESS') throw new Error('تم تسليم الامتحان بالفعل');

    // حساب الوقت المستغرق
    const now = new Date();
    const started = new Date(attempt.startedAt);
    const timeTaken = Math.floor((now.getTime() - started.getTime()) / 1000);
    const maxTime = attempt.exam.durationMinutes * 60;

    // إذا تجاوز الوقت، نعتبره Auto Submit
    let status = 'SUBMITTED';
    if (timeTaken > maxTime) {
      status = 'AUTO_SUBMITTED';
    }

    // معالجة الإجابات النهائية (إذا أرسلها العميل)
    // إذا لم يرسل إجابات، نستخدم الإجابات المحفوظة مسبقاً
    let answersToGrade = attempt.answers;
    if (finalAnswers && finalAnswers.length > 0) {
      // نستبدل الإجابات المؤقتة بالنهائية
      await prisma.examAnswer.deleteMany({ where: { attemptId } });
      await prisma.examAnswer.createMany({
        data: finalAnswers.map((a: any) => ({
          attemptId,
          questionId: a.questionId,
          answerText: a.answerText,
          answerJson: a.answerJson,
        })),
      });
      answersToGrade = await prisma.examAnswer.findMany({
        where: { attemptId },
        include: { question: { include: { options: true } } },
      });
    }

    // التصحيح الآلي للموضوعي
    const questionMap = new Map();
    attempt.exam.questions.forEach(q => {
      questionMap.set(q.questionId, q.question);
    });

    let totalAutoMarks = 0;
    let hasEssay = false;
    let correctCount = 0;
    let wrongCount = 0;
    let unattemptedCount = 0;

    const gradedAnswers = [];

    for (const ans of answersToGrade) {
      const question = questionMap.get(ans.questionId);
      if (!question) continue;

      let isCorrect = null;
      let marksAwarded = null;

      if (question.type === 'ESSAY') {
        hasEssay = true;
        // لا نصحح آلياً
      } else if (question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE') {
        const selectedId = ans.answerJson?.selectedOptionId;
        const selectedOption = question.options.find(o => o.id === selectedId);
        if (selectedOption) {
          isCorrect = selectedOption.isCorrect;
          marksAwarded = isCorrect ? question.marks : 0;
          if (isCorrect) { totalAutoMarks += question.marks; correctCount++; }
          else { wrongCount++; }
        } else {
          unattemptedCount++;
        }
      } else if (question.type === 'MULTIPLE_SELECT') {
        const selectedIds = ans.answerJson?.selectedOptionIds || [];
        const correctIds = question.options.filter(o => o.isCorrect).map(o => o.id);
        const allCorrect = correctIds.every(id => selectedIds.includes(id)) &&
                           selectedIds.every(id => correctIds.includes(id));
        isCorrect = allCorrect;
        marksAwarded = allCorrect ? question.marks : 0;
        if (isCorrect) { totalAutoMarks += question.marks; correctCount++; }
        else { wrongCount++; }
      } else if (question.type === 'FILL_BLANK') {
        // مقارنة بسيطة
        const correctAnswer = question.options.find(o => o.isCorrect)?.optionText || '';
        const isCorrectAns = ans.answerText?.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
        isCorrect = isCorrectAns;
        marksAwarded = isCorrectAns ? question.marks : 0;
        if (isCorrectAns) { totalAutoMarks += question.marks; correctCount++; }
        else { wrongCount++; }
      }
      // ORDERING, MATCHING يمكن إضافتها لاحقاً

      // تحديث الإجابة بالتصحيح
      await prisma.examAnswer.update({
        where: { id: ans.id },
        data: { isCorrect, marksAwarded },
      });

      gradedAnswers.push({ ...ans, isCorrect, marksAwarded });
    }

    // حساب عدد الأسئلة التي لم تُجب (من total)
    const totalQuestions = attempt.exam.questions.length;
    unattemptedCount = totalQuestions - (correctCount + wrongCount + (hasEssay ? 1 : 0)); // تبسيط

    const finalStatus = hasEssay ? 'GRADED_PARTIAL' : 'COMPLETED';
    const finalMarks = hasEssay ? totalAutoMarks : totalAutoMarks;

    // تحديث المحاولة
    const updatedAttempt = await prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        submittedAt: now,
        timeTakenSeconds: Math.min(timeTaken, maxTime), // لا نتجاوز الوقت المسموح
        status: finalStatus as ExamAttemptStatus,
        marksObtained: finalMarks,
        gradedAt: hasEssay ? null : new Date(),
      },
    });

    // إنشاء النتيجة
    await prisma.result.create({
      data: {
        studentId: attempt.studentId,
        examAttemptId: attemptId,
        referenceType: 'EXAM',
        totalMarks: attempt.exam.totalMarks,
        obtainedMarks: finalMarks,
        percentage: (finalMarks / attempt.exam.totalMarks) * 100,
        correctCount,
        wrongCount,
        unattemptedCount,
        timeTakenSeconds: Math.min(timeTaken, maxTime),
        attemptNumber: attempt.attemptNumber,
        status: finalStatus as ResultStatus,
        gradedAt: hasEssay ? null : new Date(),
      },
    });

    return { status: finalStatus, marks: finalMarks, hasEssay, autoSubmitted: status === 'AUTO_SUBMITTED' };
  }

  // التصحيح اليدوي للمقالي (مشابه لـ SubmissionService)
  static async gradeEssayAnswer(answerId: string, teacherId: string, marksAwarded: number) {
    const answer = await prisma.examAnswer.findUnique({
      where: { id: answerId },
      include: {
        attempt: {
          include: {
            exam: true,
            student: true,
          },
        },
        question: true,
      },
    });
    if (!answer) throw new Error('الإجابة غير موجودة');
    if (answer.question.type !== 'ESSAY') throw new Error('هذا السؤال ليس مقالياً');

    const teacher = await prisma.teacher.findUnique({ where: { userId: teacherId } });
    if (!teacher || teacher.id !== answer.attempt.exam.teacherId) {
      throw new Error('ليس لديك صلاحية تصحيح هذا الامتحان');
    }

    const updated = await prisma.examAnswer.update({
      where: { id: answerId },
      data: {
        marksAwarded,
        reviewedById: teacher.id,
        reviewedAt: new Date(),
      },
    });

    // إعادة حساب الدرجة الكلية
    await this.recalculateExamMarks(answer.attemptId);

    return updated;
  }

  private static async recalculateExamMarks(attemptId: string) {
    const answers = await prisma.examAnswer.findMany({
      where: { attemptId },
    });
    const total = answers.reduce((sum, a) => sum + (a.marksAwarded || 0), 0);

    const hasUnreviewedEssay = answers.some(a => a.marksAwarded === null && a.question.type === 'ESSAY');
    const status = hasUnreviewedEssay ? 'GRADED_PARTIAL' : 'COMPLETED';

    await prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        marksObtained: total,
        status: status as ExamAttemptStatus,
        gradedAt: status === 'COMPLETED' ? new Date() : null,
      },
    });

    const result = await prisma.result.findFirst({
      where: { examAttemptId: attemptId },
    });
    if (result) {
      await prisma.result.update({
        where: { id: result.id },
        data: {
          obtainedMarks: total,
          percentage: (total / result.totalMarks) * 100,
          status: status as ResultStatus,
          gradedAt: status === 'COMPLETED' ? new Date() : null,
        },
      });
    }
  }
}
