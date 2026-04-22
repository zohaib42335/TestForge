import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommentType, UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentsService } from './comments.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Roles(UserRole.ADMIN, UserRole.QA_MANAGER, UserRole.TESTER)
  @Post('test-cases/:testCaseId/comments')
  addComment(
    @Param('testCaseId') testCaseId: string,
    @CurrentUser() user: { companyId: string; userId: string },
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.addComment(
      testCaseId,
      user.companyId,
      user.userId,
      dto,
    );
  }

  @Get('test-cases/:testCaseId/comments')
  getComments(
    @Param('testCaseId') testCaseId: string,
    @CurrentUser() user: { companyId: string },
    @Query('type') type?: CommentType,
  ) {
    return this.commentsService.getComments(testCaseId, user.companyId, type);
  }

  @Patch('comments/:id')
  editComment(
    @Param('id') commentId: string,
    @CurrentUser() user: { userId: string },
    @Body() body: { text: string },
  ) {
    return this.commentsService.editComment(commentId, user.userId, body.text || '');
  }

  @Delete('comments/:id')
  deleteComment(
    @Param('id') commentId: string,
    @CurrentUser() user: { companyId: string; userId: string; role: import('@prisma/client').UserRole },
  ) {
    return this.commentsService.deleteComment(
      commentId,
      user.companyId,
      user.userId,
      user.role,
    );
  }

  @Get('projects/:projectId/comment-counts')
  getCommentCounts(
    @Param('projectId') _projectId: string,
    @CurrentUser() user: { companyId: string },
    @Query('testCaseIds') testCaseIds?: string,
  ) {
    const ids = String(testCaseIds || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    return this.commentsService.getCommentCounts(ids, user.companyId);
  }
}
