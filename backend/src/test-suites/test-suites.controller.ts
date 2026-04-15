import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateSuiteDto } from './dto/create-suite.dto';
import { TestSuitesService } from './test-suites.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class TestSuitesController {
  constructor(private readonly testSuitesService: TestSuitesService) {}

  @Post('projects/:projectId/suites')
  createSuite(
    @Param('projectId') projectId: string,
    @CurrentUser() user: { companyId: string; userId: string },
    @Body() dto: CreateSuiteDto,
  ) {
    return this.testSuitesService.createSuite(projectId, user.companyId, user.userId, dto);
  }

  @Get('projects/:projectId/suites')
  getSuites(
    @Param('projectId') projectId: string,
    @CurrentUser() user: { companyId: string },
  ) {
    return this.testSuitesService.getSuites(projectId, user.companyId);
  }

  @Patch('suites/:id')
  updateSuite(
    @Param('id') suiteId: string,
    @CurrentUser() user: { companyId: string; role: import('@prisma/client').UserRole },
    @Body() dto: CreateSuiteDto,
  ) {
    return this.testSuitesService.updateSuite(suiteId, user.companyId, user.role, dto);
  }

  @Delete('suites/:id')
  deleteSuite(
    @Param('id') suiteId: string,
    @CurrentUser() user: { companyId: string; role: import('@prisma/client').UserRole },
  ) {
    return this.testSuitesService.deleteSuite(suiteId, user.companyId, user.role);
  }
}
