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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateRunDto } from './dto/create-run.dto';
import { UpdateResultDto } from './dto/update-result.dto';
import { TestRunsService } from './test-runs.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects/:projectId/runs')
export class TestRunsController {
  constructor(private readonly testRunsService: TestRunsService) {}

  @Post()
  createRun(
    @Param('projectId') projectId: string,
    @CurrentUser() user: { companyId: string; userId: string; role: import('@prisma/client').UserRole },
    @Body() dto: CreateRunDto,
  ) {
    return this.testRunsService.createRun(
      projectId,
      user.companyId,
      user.userId,
      user.role,
      dto,
    );
  }

  @Get()
  getRuns(
    @Param('projectId') projectId: string,
    @CurrentUser() user: { companyId: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedPage = Number(page || 1);
    const parsedLimit = Number(limit || 20);
    return this.testRunsService.getRuns(projectId, user.companyId, parsedPage, parsedLimit);
  }

  @Get(':id')
  getRun(
    @Param('projectId') projectId: string,
    @Param('id') runId: string,
    @CurrentUser() user: { companyId: string },
  ) {
    return this.testRunsService.getRun(runId, projectId, user.companyId);
  }

  @Post(':id/start')
  startRun(
    @Param('projectId') projectId: string,
    @Param('id') runId: string,
    @CurrentUser() user: { companyId: string; userId: string },
  ) {
    return this.testRunsService.startRun(runId, projectId, user.companyId, user.userId);
  }

  @Patch(':id/results/:resultId')
  updateResult(
    @Param('projectId') projectId: string,
    @Param('id') runId: string,
    @Param('resultId') resultId: string,
    @CurrentUser() user: { companyId: string; userId: string },
    @Body() dto: UpdateResultDto,
  ) {
    return this.testRunsService.updateResult(
      runId,
      resultId,
      projectId,
      user.companyId,
      user.userId,
      dto,
    );
  }

  @Delete(':id')
  deleteRun(
    @Param('projectId') projectId: string,
    @Param('id') runId: string,
    @CurrentUser() user: { companyId: string; userId: string; role: import('@prisma/client').UserRole },
  ) {
    return this.testRunsService.deleteRun(
      runId,
      projectId,
      user.companyId,
      user.userId,
      user.role,
    );
  }

  @Get(':id/stats')
  getRunStats(
    @Param('projectId') projectId: string,
    @Param('id') runId: string,
    @CurrentUser() user: { companyId: string },
  ) {
    return this.testRunsService.getRunStats(runId, projectId, user.companyId);
  }
}
