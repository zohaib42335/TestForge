import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createNotification(dto: {
    recipientId: string;
    senderId?: string | null;
    companyId: string;
    projectId?: string | null;
    type: string;
    title: string;
    message: string;
    entityType?: string | null;
    entityId?: string | null;
  }) {
    return this.prisma.notification.create({
      data: {
        recipientId: dto.recipientId,
        senderId: dto.senderId || null,
        companyId: dto.companyId,
        projectId: dto.projectId || null,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        entityType: dto.entityType || null,
        entityId: dto.entityId || null,
      },
    });
  }

  async getNotifications(userId: string, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: {
        recipientId: userId,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      include: {
        sender: { select: { id: true, displayName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(notificationId: string, userId: string) {
    const existing = await this.prisma.notification.findUnique({ where: { id: notificationId } });
    if (!existing) throw new NotFoundException('Notification not found.');
    if (existing.recipientId !== userId) throw new ForbiddenException('Access denied.');
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true },
    });
    return { updated: result.count };
  }

  async deleteNotification(notificationId: string, userId: string) {
    const existing = await this.prisma.notification.findUnique({ where: { id: notificationId } });
    if (!existing) throw new NotFoundException('Notification not found.');
    if (existing.recipientId !== userId) throw new ForbiddenException('Access denied.');
    await this.prisma.notification.delete({ where: { id: notificationId } });
    return { message: 'Notification deleted.' };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { recipientId: userId, isRead: false },
    });
    return count;
  }
}
