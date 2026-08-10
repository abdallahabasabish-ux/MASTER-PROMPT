import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AuditLogService {
  static async getLogs(filters?: {
    userId?: string;
    action?: string;
    targetType?: string;
    fromDate?: Date;
    toDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.action) where.action = filters.action;
    if (filters?.targetType) where.targetType = filters.targetType;
    if (filters?.fromDate) where.timestamp = { gte: filters.fromDate };
    if (filters?.toDate) where.timestamp = { ...where.timestamp, lte: filters.toDate };

    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, fullName: true, email: true, role: true },
          },
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // جلب قائمة بالإجراءات المتاحة للفلترة
  static async getDistinctActions() {
    const actions = await prisma.auditLog.groupBy({
      by: ['action'],
      orderBy: { action: 'asc' },
    });
    return actions.map(a => a.action);
  }

  static async getDistinctTargetTypes() {
    const types = await prisma.auditLog.groupBy({
      by: ['targetType'],
      orderBy: { targetType: 'asc' },
    });
    return types.map(t => t.targetType);
  }
}
