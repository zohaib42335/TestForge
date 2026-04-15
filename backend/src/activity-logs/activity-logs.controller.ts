import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ActivityLogsService } from './activity-logs.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Get('projects/:projectId/activity')
  getLogs(
    @Param('projectId') projectId: string,
    @CurrentUser() user: { companyId: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('entityType') entityType?: string,
    @Query('actorId') actorId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.activityLogsService.getLogs(user.companyId, projectId, {
      page: Number(page || 1),
      limit: Number(limit || 20),
      entityType,
      actorId,
      dateFrom,
      dateTo,
    });
  }

  @Get('activity/:entityId/entity')
  getEntityLogs(
    @Param('entityId') entityId: string,
    @CurrentUser() user: { companyId: string },
  ) {
    return this.activityLogsService.getEntityLogs(entityId, user.companyId);
  }
}
