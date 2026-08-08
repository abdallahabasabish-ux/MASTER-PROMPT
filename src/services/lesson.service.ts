// src/services/lesson.service.ts (إضافة دوال)
export class LessonService {
  // ... الدوال السابقة

  // جلب جميع دروس المدرس مع خيارات الفلترة
  static async getTeacherLessons(
    teacherUserId: string,
    filters?: { status?: LessonStatus; unitId?: string; gradeId?: string }
  ) {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: teacherUserId },
    });
    if (!teacher) throw new Error('المدرس غير موجود');

    const where: any = { teacherId: teacher.id };
    if (filters?.status) where.status = filters.status;
    if (filters?.unitId) where.unitId = filters.unitId;
    if (filters?.gradeId) {
      where.unit = { gradeId: filters.gradeId };
    }

    return prisma.lesson.findMany({
      where,
      include: {
        unit: {
          include: { subject: true, grade: true, term: true },
        },
        content: true,
        videos: true,
        files: true,
        assignments: {
          select: { id: true, title: true, status: true },
        },
      },
      orderBy: { order: 'asc' },
    });
  }

  // حذف درس (مع التحقق من الصلاحية)
  static async deleteLesson(lessonId: string, teacherUserId: string) {
    const lesson = await prisma.lesson.findFirst({
      where: { id: lessonId, teacher: { userId: teacherUserId } },
      include: { assignments: true, content: true, videos: true, files: true },
    });
    if (!lesson) throw new Error('الدرس غير موجود أو لا تملك صلاحية');
    if (lesson.status === 'PUBLISHED') {
      throw new Error('لا يمكن حذف درس منشور. قم بأرشفته أولاً.');
    }

    // حذف المحتوى المرتبط
    await prisma.$transaction([
      prisma.lessonContent.deleteMany({ where: { lessonId } }),
      prisma.lessonVideo.deleteMany({ where: { lessonId } }),
      prisma.lessonFile.deleteMany({ where: { lessonId } }),
      prisma.lesson.delete({ where: { id: lessonId } }),
    ]);

    return { success: true };
  }
}
