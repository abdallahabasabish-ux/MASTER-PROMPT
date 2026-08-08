import { PrismaClient, LessonProgressStatus } from '@prisma/client';

const prisma = new PrismaClient();

export class ProgressService {
  // تحديث تقدم فيديو (يُستدعى عند تغيير موضع الفيديو أو pause/play)
  static async updateVideoProgress(
    studentId: string,
    videoId: string,
    progress: number, // 0-100
    position: number // بالثواني
  ) {
    const student = await prisma.student.findUnique({ where: { userId: studentId } });
    if (!student) throw new Error('الطالب غير موجود');

    const isCompleted = progress >= 90; // إذا شاهد 90% أو أكثر

    const videoProgress = await prisma.videoProgress.upsert({
      where: {
        studentId_videoId: {
          studentId: student.id,
          videoId,
        },
      },
      update: {
        progress,
        lastPosition: position,
        isCompleted,
        updatedAt: new Date(),
      },
      create: {
        studentId: student.id,
        videoId,
        progress,
        lastPosition: position,
        isCompleted,
      },
    });

    // إذا اكتمل الفيديو، نقوم بتحديث تقدم الدرس المرتبط
    if (isCompleted) {
      await this.updateLessonProgressFromVideo(student.id, videoId);
    }

    // تحديث إحصائيات الطالب
    await this.recalculateStudentStats(student.id);

    return videoProgress;
  }

  // تحديث تقدم الدرس بناءً على اكتمال الفيديو
  private static async updateLessonProgressFromVideo(studentId: string, videoId: string) {
    const video = await prisma.lessonVideo.findUnique({
      where: { id: videoId },
      include: { lesson: true },
    });
    if (!video) return;

    const lesson = video.lesson;

    // جلب جميع فيديوهات الدرس
    const videos = await prisma.lessonVideo.findMany({
      where: { lessonId: lesson.id },
    });

    // جلب تقدم الطالب لكل فيديو
    const videoProgresses = await prisma.videoProgress.findMany({
      where: {
        studentId,
        videoId: { in: videos.map(v => v.id) },
      },
    });

    // التحقق من أن جميع الفيديوهات مكتملة (أو لا يوجد فيديوهات)
    const allVideosCompleted = videos.length === 0 || 
      videos.every(v => videoProgresses.some(vp => vp.videoId === v.id && vp.isCompleted));

    // جلب تقدم الدرس الحالي
    const lessonProgress = await prisma.lessonProgress.findUnique({
      where: {
        studentId_lessonId: {
          studentId,
          lessonId: lesson.id,
        },
      },
    });

    // تحديث حالة إكمال الفيديو
    const updateData: any = {
      videoCompleted: allVideosCompleted,
      lastActivityAt: new Date(),
    };

    // إذا كانت جميع الفيديوهات مكتملة، نضيف وقت الدراسة (تقديري)
    if (allVideosCompleted && !lessonProgress?.videoCompleted) {
      // يمكن إضافة وقت تقديري
    }

    // التحقق من اكتمال الدرس
    const current = lessonProgress || { videoCompleted: false, contentViewed: false, assignmentDone: false, examDone: false };
    const isComplete = allVideosCompleted && 
                      (current.contentViewed || false) && 
                      (current.assignmentDone || false) && 
                      (current.examDone || false);

    await prisma.lessonProgress.upsert({
      where: {
        studentId_lessonId: {
          studentId,
          lessonId: lesson.id,
        },
      },
      update: {
        ...updateData,
        status: isComplete ? 'COMPLETED' : 'IN_PROGRESS',
        completedAt: isComplete ? new Date() : null,
      },
      create: {
        studentId,
        lessonId: lesson.id,
        videoCompleted: allVideosCompleted,
        contentViewed: false,
        assignmentDone: false,
        examDone: false,
        status: isComplete ? 'COMPLETED' : 'IN_PROGRESS',
        completedAt: isComplete ? new Date() : null,
        lastActivityAt: new Date(),
      },
    });
  }

  // تحديث حالة "تم مشاهدة المحتوى النصي" (يُستدعى عند فتح الدرس أو التمرير للأسفل)
  static async markContentViewed(studentId: string, lessonId: string) {
    const student = await prisma.student.findUnique({ where: { userId: studentId } });
    if (!student) throw new Error('الطالب غير موجود');

    const progress = await prisma.lessonProgress.findUnique({
      where: {
        studentId_lessonId: {
          studentId: student.id,
          lessonId,
        },
      },
    });

    if (!progress) {
      // إنشاء سجل تقدم جديد
      await prisma.lessonProgress.create({
        data: {
          studentId: student.id,
          lessonId,
          contentViewed: true,
          status: 'IN_PROGRESS',
          lastActivityAt: new Date(),
        },
      });
    } else {
      await prisma.lessonProgress.update({
        where: { id: progress.id },
        data: { contentViewed: true, lastActivityAt: new Date() },
      });
    }

    // التحقق من اكتمال الدرس
    await this.checkAndCompleteLesson(student.id, lessonId);
    await this.recalculateStudentStats(student.id);
  }

  // تحديث تقدم الواجب (يُستدعى عند تقديم الواجب)
  static async markAssignmentDone(studentId: string, assignmentId: string) {
    const student = await prisma.student.findUnique({ where: { userId: studentId } });
    if (!student) throw new Error('الطالب غير موجود');

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { lesson: true },
    });
    if (!assignment) throw new Error('الواجب غير موجود');

    // تحديث تقدم الدرس
    const progress = await prisma.lessonProgress.findUnique({
      where: {
        studentId_lessonId: {
          studentId: student.id,
          lessonId: assignment.lessonId,
        },
      },
    });

    if (progress) {
      await prisma.lessonProgress.update({
        where: { id: progress.id },
        data: { assignmentDone: true, lastActivityAt: new Date() },
      });
    } else {
      await prisma.lessonProgress.create({
        data: {
          studentId: student.id,
          lessonId: assignment.lessonId,
          assignmentDone: true,
          status: 'IN_PROGRESS',
          lastActivityAt: new Date(),
        },
      });
    }

    await this.checkAndCompleteLesson(student.id, assignment.lessonId);
    await this.recalculateStudentStats(student.id);
  }

  // تحديث تقدم الامتحان (يُستدعى عند تقديم الامتحان)
  static async markExamDone(studentId: string, examId: string) {
    // مشابه لما سبق، ولكن نربط الامتحان بالدرس إذا كان الامتحان مرتبطاً بوحدة معينة
    // يمكن تعديل هذا حسب منطق العمل (بعض الامتحانات تغطي وحدة كاملة)
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { unit: { include: { lessons: true } } },
    });
    if (!exam) throw new Error('الامتحان غير موجود');

    // إذا كان الامتحان مرتبطاً بوحدة، نحدّث جميع دروس الوحدة
    if (exam.unit) {
      const lessons = await prisma.lesson.findMany({
        where: { unitId: exam.unitId },
      });
      for (const lesson of lessons) {
        await this.updateLessonProgressForExam(studentId, lesson.id);
      }
    }
    await this.recalculateStudentStats(studentId);
  }

  private static async updateLessonProgressForExam(studentId: string, lessonId: string) {
    const progress = await prisma.lessonProgress.findUnique({
      where: {
        studentId_lessonId: {
          studentId,
          lessonId,
        },
      },
    });

    if (progress) {
      await prisma.lessonProgress.update({
        where: { id: progress.id },
        data: { examDone: true, lastActivityAt: new Date() },
      });
    } else {
      await prisma.lessonProgress.create({
        data: {
          studentId,
          lessonId,
          examDone: true,
          status: 'IN_PROGRESS',
          lastActivityAt: new Date(),
        },
      });
    }
    await this.checkAndCompleteLesson(studentId, lessonId);
  }

  // التحقق من اكتمال جميع شروط الدرس
  private static async checkAndCompleteLesson(studentId: string, lessonId: string) {
    const progress = await prisma.lessonProgress.findUnique({
      where: {
        studentId_lessonId: {
          studentId,
          lessonId,
        },
      },
    });
    if (!progress) return;

    const isComplete = progress.videoCompleted && 
                       progress.contentViewed && 
                       progress.assignmentDone && 
                       progress.examDone;

    if (isComplete && progress.status !== 'COMPLETED') {
      await prisma.lessonProgress.update({
        where: { id: progress.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    }
  }

  // إعادة حساب الإحصائيات الإجمالية للطالب
  static async recalculateStudentStats(studentId: string) {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) return;

    // إحصائيات الدروس
    const lessons = await prisma.lessonProgress.findMany({
      where: { studentId: student.id },
    });
    const totalLessons = lessons.length;
    const completedLessons = lessons.filter(l => l.status === 'COMPLETED').length;

    // إحصائيات الواجبات
    const assignments = await prisma.submission.findMany({
      where: { studentId: student.id, status: { in: ['COMPLETED', 'GRADED_PARTIAL'] } },
    });
    const totalAssignments = await prisma.assignment.count({
      where: { status: 'PUBLISHED' },
    });
    const completedAssignments = assignments.length;

    // إحصائيات الامتحانات
    const exams = await prisma.examAttempt.findMany({
      where: { studentId: student.id, status: { in: ['COMPLETED', 'GRADED_PARTIAL'] } },
    });
    const totalExams = await prisma.exam.count({
      where: { status: 'PUBLISHED' },
    });
    const completedExams = exams.length;

    // متوسط الدرجات
    const results = await prisma.result.findMany({
      where: { studentId: student.id, status: 'COMPLETED' },
    });
    const avgScore = results.length > 0 
      ? results.reduce((sum, r) => sum + r.percentage, 0) / results.length 
      : 0;

    await prisma.studentStats.upsert({
      where: { studentId: student.id },
      update: {
        totalLessons,
        completedLessons,
        totalAssignments,
        completedAssignments,
        totalExams,
        completedExams,
        averageScore: Math.round(avgScore * 100) / 100,
        lastActiveAt: new Date(),
        updatedAt: new Date(),
      },
      create: {
        studentId: student.id,
        totalLessons,
        completedLessons,
        totalAssignments,
        completedAssignments,
        totalExams,
        completedExams,
        averageScore: Math.round(avgScore * 100) / 100,
        lastActiveAt: new Date(),
      },
    });
  }

  // جلب لوحة تحكم الطالب (جميع البيانات)
  static async getStudentDashboard(studentId: string) {
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

    // جلب آخر الدروس التي تمت مشاهدتها (آخر 5)
    const recentLessons = await prisma.lessonProgress.findMany({
      where: { studentId: student.id },
      include: {
        lesson: {
          include: {
            unit: { include: { subject: true } },
            content: true,
            videos: true,
          },
        },
      },
      orderBy: { lastActivityAt: 'desc' },
      take: 5,
    });

    // جلب آخر النتائج
    const recentResults = await prisma.result.findMany({
      where: { studentId: student.id },
      include: {
        submission: { include: { assignment: true } },
        examAttempt: { include: { exam: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // جلب الواجبات والامتحانات القادمة (التي لم تبدأ بعد)
    const now = new Date();
    const upcomingAssignments = await prisma.assignment.findMany({
      where: {
        status: 'PUBLISHED',
        startDate: { gt: now },
        lesson: { unit: { gradeId: student.gradeId } },
      },
      include: { lesson: true },
      orderBy: { startDate: 'asc' },
      take: 3,
    });

    const upcomingExams = await prisma.exam.findMany({
      where: {
        status: 'PUBLISHED',
        startDate: { gt: now },
        gradeId: student.gradeId,
      },
      include: { unit: true },
      orderBy: { startDate: 'asc' },
      take: 3,
    });

    return {
      student,
      stats: student.stats,
      recentLessons,
      recentResults,
      upcomingAssignments,
      upcomingExams,
    };
  }

  // جلب تقدم الطالب في منهج معين (جميع الدروس)
  static async getStudentCurriculumProgress(studentId: string, gradeId?: string) {
    const student = await prisma.student.findUnique({ where: { userId: studentId } });
    if (!student) throw new Error('الطالب غير موجود');

    const whereCondition: any = { studentId: student.id };
    if (gradeId) {
      whereCondition.lesson = { unit: { gradeId } };
    }

    const progresses = await prisma.lessonProgress.findMany({
      where: whereCondition,
      include: {
        lesson: {
          include: {
            unit: { include: { subject: true } },
          },
        },
      },
      orderBy: { lesson: { order: 'asc' } },
    });

    // تنظيم البيانات حسب الوحدة
    const unitsMap = new Map();
    progresses.forEach(p => {
      const unitId = p.lesson.unitId;
      if (!unitsMap.has(unitId)) {
        unitsMap.set(unitId, {
          unit: p.lesson.unit,
          lessons: [],
          completedCount: 0,
          totalCount: 0,
        });
      }
      const unitData = unitsMap.get(unitId);
      unitData.lessons.push(p);
      unitData.totalCount++;
      if (p.status === 'COMPLETED') unitData.completedCount++;
    });

    return Array.from(unitsMap.values());
  }
}
