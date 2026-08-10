import { PrismaClient, NotificationType } from '@prisma/client';

const prisma = new PrismaClient();

export class NotificationService {
  // إنشاء إشعار لمستخدم واحد
  static async createForUser(
    userId: string,
    data: {
      title: string;
      message: string;
      type: NotificationType;
      link?: string;
      data?: any;
    }
  ) {
    return prisma.notification.create({
      data: {
        userId,
        title: data.title,
        message: data.message,
        type: data.type,
        link: data.link,
        data: data.data,
      },
    });
  }

  // إنشاء إشعارات لمجموعة من المستخدمين (مثل جميع طلاب صف معين)
  static async createForManyUsers(
    userIds: string[],
    data: {
      title: string;
      message: string;
      type: NotificationType;
      link?: string;
      data?: any;
    }
  ) {
    const notifications = userIds.map(userId => ({
      userId,
      title: data.title,
      message: data.message,
      type: data.type,
      link: data.link,
      data: data.data,
    }));

    return prisma.notification.createMany({
      data: notifications,
    });
  }

  // جلب إشعارات المستخدم مع Pagination
  static async getUserNotifications(
    userId: string,
    options?: { page?: number; limit?: number; onlyUnread?: boolean }
  ) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (options?.onlyUnread) {
      where.isRead = false;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    // حساب عدد غير المقروء
    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return {
      data: notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // تحديد إشعار كمقروء
  static async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notification) throw new Error('الإشعار غير موجود');

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  // تحديد جميع الإشعارات كمقروءة
  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  // حذف إشعار
  static async deleteNotification(notificationId: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notification) throw new Error('الإشعار غير موجود');

    return prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  // حذف جميع الإشعارات المقروءة (للمستخدم)
  static async deleteAllRead(userId: string) {
    return prisma.notification.deleteMany({
      where: { userId, isRead: true },
    });
  }
}
