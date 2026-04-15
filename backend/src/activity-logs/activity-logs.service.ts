import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';

@Injectable()
export class ActivityLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async log(dto: CreateActivityLogDto) {
    try {
      await this.prisma.activityLog.create({
        data: {
          companyId: dto.companyId,
          projectId: dto.projectId || null,
          actorId: dto.actorId,
          action: dto.action,
          entityType: dto.entityType,
          entityId: dto.entityId,
          entityRef: dto.entityRef || null,
          changes: (dto.changes || undefined) as Prisma.InputJsonValue,
          metadata: (dto.metadata || undefined) as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      console.error('[ActivityLogsService.log] failed:', error);
    }
  }

  async getLogs(
    companyId: string,
    projectId: string,
    filters: {
      page?: number;
      limit?: number;
      entityType?: string;
      actorId?: string;
      dateFrom?: string;
      dateTo?: string;
    },
  ) {
    const page = Math.max(1, Number(filters.page || 1));
    const limit = Math.min(100, Math.max(1, Number(filters.limit || 20)));
    const skip = (page - 1) * limit;
    const where: Prisma.ActivityLogWhereInput = {
      companyId,
      projectId,
      ...(filters.entityType ? { entityType: filters.entityType } : {}),
      ...(filters.actorId ? { actorId: filters.actorId } : {}),
      ...(filters.dateFrom || filters.dateTo
        ? {
            createdAt: {
              ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
              ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
            },
          }
        : {}),
    };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.activityLog.count({ where }),
      this.prisma.activityLog.findMany({
        where,
        include: { actor: { select: { id: true, displayName: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getEntityLogs(entityId: string, companyId: string) {
    return this.prisma.activityLog.findMany({
      where: { companyId, entityId },
      include: { actor: { select: { id: true, displayName: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}
