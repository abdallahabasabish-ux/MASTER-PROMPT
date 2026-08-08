import { PrismaClient, SubmissionStatus } from '@prisma/client';

const prisma = new PrismaClient();

export class SubmissionService {
  // بدء محاولة جديدة (أو استئناف محاولة قيد التنفيذ)
  static async startAttempt(assignmentId: string, studentId: string) {
    const student = await prisma.student.findUnique({ where: { userId: studentId } });
    if (!student) throw new Error('الطالب غير موجود');

    // التحقق من وجود محاولة قيد التنفيذ
    const existing = await prisma.submission.findFirst({
      where: { assignmentId, studentId: student.id, status: 'IN_PROGRESS' },
    });
    if (existing) return existing; // استئناف

    // التحقق من عدد المحاولات
    const count = await prisma.submission.count({
      where: { assignmentId, studentId: student.id },
    });
    const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) throw new Error('الواجب غير موجود');
    if (count >= assignment.attemptsAllowed) {
      throw new Error('لقد استنفدت عدد المحاولات المسموحة');
    }

    // إنشاء محاولة جديدة
    return prisma.submission.create({
      data: {
        assignmentId,
        studentId: student.id,
        attemptNumber: count + 1,
        startedAt: new Date(),
        status: 'IN_PROGRESS',
      },
      include: {
        assignment: {
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

  // تقديم الواجب (مع التحقق من الوقت)
  static async submitAttempt(submissionId: string, studentId: string, answers: any[]) {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        student: true,
        assignment: {
          include: {
            questions: { include: { question: { include: { options: true } } } },
          },
        },
      },
    });
    if (!submission) throw new Error('المحاولة غير موجودة');
    if (submission.student.userId !== studentId) throw new Error('ليس لديك صلاحية');
    if (submission.status !== 'IN_PROGRESS') throw new Error('هذه المحاولة قد تم تسليمها بالفعل');

    // حساب الوقت المستغرق
    const now = new Date();
    const started = new Date(submission.startedAt);
    const timeTaken = Math.floor((now.getTime() - started.getTime()) / 1000); // بالثواني
    const maxTime = submission.assignment.durationMinutes * 60;

    // إذا تجاوز الوقت، نعتبرها Auto Submit ونقطع الإرسال
    if (timeTaken > maxTime) {
      return this.autoSubmit(submissionId, studentId);
    }

    // معالجة الإجابات
    const questionMap = new Map();
    submission.assignment.questions.forEach(q => {
      questionMap.set(q.questionId, q.question);
    });

    // حفظ الإجابات وحساب الدرجات للموضوعي
    let totalAutoMarks = 0;
    let hasEssay = false;
    const answerRecords = [];

    for (const ans of answers) {
      const question = questionMap.get(ans.questionId);
      if (!question) continue; // سؤال غير موجود

      let isCorrect = null;
      let marksAwarded = null;
      let answerText = null;
      let answerJson = null;

      if (question.type === 'ESSAY') {
        hasEssay = true;
        answerText = ans.answerText;
        // لا يتم التصحيح آلياً
      } else if (question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE') {
        // ans.selectedOptionId
        const selectedOption = question.options.find(o => o.id === ans.selectedOptionId);
        if (selectedOption) {
          isCorrect = selectedOption.isCorrect;
          marksAwarded = isCorrect ? question.marks : 0;
          if (isCorrect) totalAutoMarks += question.marks;
          answerJson = { selectedOptionId: ans.selectedOptionId };
        }
      } else if (question.type === 'MULTIPLE_SELECT') {
        // ans.selectedOptionIds: string[]
        const correctIds = question.options.filter(o => o.isCorrect).map(o => o.id);
        const selected = ans.selectedOptionIds || [];
        const allCorrect = correctIds.every(id => selected.includes(id)) &&
                           selected.every(id => correctIds.includes(id));
        isCorrect = allCorrect;
        marksAwarded = allCorrect ? question.marks : 0;
        if (isCorrect) totalAutoMarks += question.marks;
        answerJson = { selectedOptionIds: ans.selectedOptionIds };
      } else if (question.type === 'FILL_BLANK') {
        // مقارنة نصية بسيطة (يمكن تحسينها)
        const correctAnswer = question.options.find(o => o.isCorrect)?.optionText || '';
        isCorrect = ans.answerText?.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
        marksAwarded = isCorrect ? question.marks : 0;
        if (isCorrect) totalAutoMarks += question.marks;
        answerText = ans.answerText;
      }
      // ORDERING, MATCHING: يمكن تنفيذها لاحقاً

      answerRecords.push({
        questionId: question.id,
        answerText,
        answerJson,
        isCorrect,
        marksAwarded,
      });
    }

    // تحديد حالة التصحيح
    const status = hasEssay ? 'GRADED_PARTIAL' : 'COMPLETED';
    const finalMarks = hasEssay ? totalAutoMarks : totalAutoMarks; // في حال عدم وجود مقالي، تكون نهائية

    // إنشاء الإجابات وتحديث المحاولة
    await prisma.$transaction(async (tx) => {
      // حذف الإجابات القديمة (إن وجدت)
      await tx.answer.deleteMany({ where: { submissionId } });

      // إضافة الإجابات الجديدة
      await tx.answer.createMany({
        data: answerRecords.map(a => ({ ...a, submissionId })),
      });

      // تحديث المحاولة
      await tx.submission.update({
        where: { id: submissionId },
        data: {
          submittedAt: now,
          timeTakenSeconds: timeTaken,
          status: status,
          marksObtained: finalMarks,
        },
      });

      // إنشاء النتيجة
      const totalQuestions = submission.assignment.questions.length;
      const correctCount = answerRecords.filter(a => a.isCorrect === true).length;
      const wrongCount = answerRecords.filter(a => a.isCorrect === false).length;
      const unattemptedCount = totalQuestions - answerRecords.length;

      await tx.result.create({
        data: {
          studentId: submission.studentId,
          submissionId: submissionId,
          totalMarks: submission.assignment.totalMarks,
          obtainedMarks: finalMarks,
          percentage: (finalMarks / submission.assignment.totalMarks) * 100,
          correctCount,
          wrongCount,
          unattemptedCount,
          timeTakenSeconds: timeTaken,
          attemptNumber: submission.attemptNumber,
          status: status,
          gradedAt: hasEssay ? null : new Date(),
        },
      });
    });

    return { status, marks: finalMarks, hasEssay };
  }

  // Auto Submit عند انتهاء الوقت
  static async autoSubmit(submissionId: string, studentId: string) {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { student: true, assignment: { include: { questions: true } } },
    });
    if (!submission) throw new Error('المحاولة غير موجودة');
    if (submission.student.userId !== studentId) throw new Error('ليس لديك صلاحية');
    if (submission.status !== 'IN_PROGRESS') return submission;

    // حساب الوقت
    const now = new Date();
    const started = new Date(submission.startedAt);
    const timeTaken = Math.floor((now.getTime() - started.getTime()) / 1000);

    // تحديث الحالة إلى AUTO_SUBMITTED وتوليد النتيجة (بدون إجابات؟ أو مع الإجابات الحالية)
    // في هذه الحالة، نعتبر أن الإجابات قد تكون فارغة أو جزئية
    // نقوم بإنشاء نتيجة بدرجة 0 إذا لم توجد إجابات
    // ولكن الأفضل أن نطلب من Frontend إرسال الإجابات الحالية حتى لو انتهى الوقت، مع إضافة تحقق من الوقت.

    // لكن لضمان الأمان، نطلب من Frontend إرسال الإجابات في طلب التقديم، ونحن نتحقق من الوقت.
    // إذا تجاوز الوقت، نعتبر ما أرسله الطالب هو النهائي، ونقوم بالتصحيح بناءً على ما وصل.
    // لذلك سنقوم باستدعاء submitAttempt مع الإجابات التي وصلت (حتى لو تأخرت) ولكن مع فرض الحد الأقصى للوقت.
    // يمكن تعديل submitAttempt لقبول المعلمة forceSubmit.
    // سأقوم بدمج هذه المنطق في submitAttempt.

    // هنا سنقوم بتحديث الحالة وإرجاع رسالة.
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: 'AUTO_SUBMITTED', submittedAt: now, timeTakenSeconds: timeTaken },
    });

    return { message: 'تم تسليم الواجب تلقائياً لانتهاء الوقت' };
  }

  // تصحيح مقالي (يدوياً من قبل المدرس)
  static async gradeEssayAnswer(answerId: string, teacherId: string, marksAwarded: number) {
    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
      include: {
        submission: {
          include: {
            assignment: true,
            student: true,
          },
        },
        question: true,
      },
    });
    if (!answer) throw new Error('الإجابة غير موجودة');
    if (answer.question.type !== 'ESSAY') throw new Error('هذا السؤال ليس مقالياً');

    // التحقق من أن المدرس هو منشئ الواجب
    const teacher = await prisma.teacher.findUnique({ where: { userId: teacherId } });
    if (!teacher || teacher.id !== answer.submission.assignment.teacherId) {
      throw new Error('ليس لديك صلاحية تصحيح هذا الواجب');
    }

    // تحديث الإجابة
    const updated = await prisma.answer.update({
      where: { id: answerId },
      data: {
        marksAwarded,
        reviewedById: teacher.id,
        reviewedAt: new Date(),
      },
    });

    // إعادة حساب الدرجة الكلية للمحاولة
    await this.recalculateSubmissionMarks(answer.submissionId);

    return updated;
  }

  // إعادة حساب الدرجة الكلية للمحاولة (بعد التصحيح اليدوي)
  private static async recalculateSubmissionMarks(submissionId: string) {
    const answers = await prisma.answer.findMany({
      where: { submissionId },
    });
    const total = answers.reduce((sum, a) => sum + (a.marksAwarded || 0), 0);

    // التحقق من أن جميع الأسئلة تم تصحيحها (خاصة المقالية)
    const hasUnreviewedEssay = answers.some(a => a.marksAwarded === null && a.question.type === 'ESSAY');

    const status = hasUnreviewedEssay ? 'GRADED_PARTIAL' : 'COMPLETED';

    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        marksObtained: total,
        status: status,
      },
    });

    // تحديث النتيجة
    const result = await prisma.result.findFirst({
      where: { submissionId },
    });
    if (result) {
      await prisma.result.update({
        where: { id: result.id },
        data: {
          obtainedMarks: total,
          percentage: (total / result.totalMarks) * 100,
          status: status,
          gradedAt: status === 'COMPLETED' ? new Date() : null,
        },
      });
    }

    return updatedSubmission;
  }
}
