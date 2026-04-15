import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommentType, UserRole } from '@prisma/client';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async addComment(
    testCaseId: string,
    companyId: string,
    authorId: string,
    dto: CreateCommentDto,
  ) {
    const testCase = await this.prisma.testCase.findFirst({
      where: { id: testCaseId, companyId },
      select: { id: true, projectId: true, testCaseId: true, assignedToId: true, title: true },
    });
    if (!testCase) {
      throw new NotFoundException('Test case not found.');
    }

    const comment = await this.prisma.comment.create({
      data: {
        testCaseId,
        projectId: testCase.projectId,
        companyId,
        authorId,
        text: dto.text.trim(),
        type: dto.type || CommentType.COMMENT,
      },
    });

    void this.activityLogsService.log({
      companyId,
      projectId: testCase.projectId,
      actorId: authorId,
      action: 'comment.added',
      entityType: 'comment',
      entityId: testCaseId,
      entityRef: testCase.testCaseId,
      metadata: { type: dto.type || CommentType.COMMENT },
    });

    if (testCase.assignedToId && testCase.assignedToId !== authorId) {
      await this.notificationsService.createNotification({
        recipientId: testCase.assignedToId,
        senderId: authorId,
        companyId,
        projectId: testCase.projectId,
        type: 'comment.added',
        title: `New comment on ${testCase.testCaseId}`,
        message: `A new comment was added to "${testCase.title}".`,
        entityType: 'testCase',
        entityId: testCaseId,
      });
    }

    return comment;
  }

  async getComments(testCaseId: string, companyId: string, type?: CommentType) {
    const comments = await this.prisma.comment.findMany({
      where: { testCaseId, companyId, ...(type ? { type } : {}) },
      include: {
        author: { select: { id: true, displayName: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return comments.map((comment) => ({
      ...comment,
      authorDisplayName: comment.author?.displayName || 'Unknown',
      authorInitials: (comment.author?.displayName || '?')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() || '')
        .join(''),
    }));
  }

  async editComment(commentId: string, authorId: string, newText: string) {
    const existing = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!existing) throw new NotFoundException('Comment not found.');
    if (existing.authorId !== authorId) {
      throw new ForbiddenException('You can only edit your own comments.');
    }
    return this.prisma.comment.update({
      where: { id: commentId },
      data: {
        text: newText.trim(),
        isEdited: true,
        editedAt: new Date(),
      },
    });
  }

  async deleteComment(
    commentId: string,
    companyId: string,
    requestingUserId: string,
    requestingRole: UserRole,
  ) {
    const existing = await this.prisma.comment.findFirst({
      where: { id: commentId, companyId },
    });
    if (!existing) throw new NotFoundException('Comment not found.');
    const canDelete = existing.authorId === requestingUserId || requestingRole === UserRole.ADMIN;
    if (!canDelete) {
      throw new ForbiddenException('Only the author or admin can delete this comment.');
    }
    await this.prisma.comment.delete({ where: { id: commentId } });
    return { message: 'Comment deleted.' };
  }

  async getCommentCounts(testCaseIds: string[], companyId: string) {
    const rows = await this.prisma.comment.groupBy({
      by: ['testCaseId'],
      where: { companyId, testCaseId: { in: testCaseIds } },
      _count: { _all: true },
    });
    return rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.testCaseId] = row._count._all;
      return acc;
    }, {});
  }
}
