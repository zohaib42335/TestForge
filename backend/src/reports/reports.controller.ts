import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ReportsService } from './reports.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects/:projectId/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('overview')
  @Roles(UserRole.ADMIN, UserRole.QA_MANAGER, UserRole.VIEWER)
  getOverview(
    @Param('projectId') projectId: string,
    @CurrentUser() user: { companyId: string },
  ) {
    return this.reportsService.getOverviewStats(projectId, user.companyId);
  }

  @Get('runs/:runId')
  @Roles(UserRole.ADMIN, UserRole.QA_MANAGER, UserRole.VIEWER)
  getExecutionReport(
    @Param('projectId') projectId: string,
    @Param('runId') runId: string,
    @CurrentUser() user: { companyId: string },
  ) {
    return this.reportsService.getExecutionReport(runId, projectId, user.companyId);
  }

  @Get('coverage')
  @Roles(UserRole.ADMIN, UserRole.QA_MANAGER, UserRole.VIEWER)
  getCoverage(
    @Param('projectId') projectId: string,
    @CurrentUser() user: { companyId: string },
  ) {
    return this.reportsService.getCoverageReport(projectId, user.companyId);
  }

  @Get('trends')
  @Roles(UserRole.ADMIN, UserRole.QA_MANAGER, UserRole.VIEWER)
  getTrends(
    @Param('projectId') projectId: string,
    @CurrentUser() user: { companyId: string },
    @Query('days') days?: string,
  ) {
    const parsedDays = Math.min(90, Math.max(1, Number(days || 30)));
    return this.reportsService.getTrendData(projectId, user.companyId, parsedDays);
  }
}
