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
import { BulkUpdateStatusDto } from './dto/bulk-update-status.dto';
import { CreateTestCaseDto } from './dto/create-test-case.dto';
import { FilterTestCasesDto } from './dto/filter-test-cases.dto';
import { UpdateTestCaseDto } from './dto/update-test-case.dto';
import { TestCasesImportService } from './test-cases-import.service';
import { TestCasesService } from './test-cases.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects/:projectId/test-cases')
export class TestCasesController {
  constructor(
    private readonly testCasesService: TestCasesService,
    private readonly testCasesImportService: TestCasesImportService,
  ) {}

  @Post()
  createTestCase(
    @Param('projectId') projectId: string,
    @CurrentUser() user: { companyId: string; userId: string },
    @Body() dto: CreateTestCaseDto,
  ) {
    return this.testCasesService.createTestCase(projectId, user.companyId, user.userId, dto);
  }

  @Get()
  getTestCases(
    @Param('projectId') projectId: string,
    @CurrentUser() user: { companyId: string },
    @Query() filterDto: FilterTestCasesDto,
  ) {
    return this.testCasesService.getTestCases(projectId, user.companyId, filterDto);
  }

  @Get('export')
  exportTestCases(
    @Param('projectId') projectId: string,
    @CurrentUser() user: { companyId: string },
  ) {
    return this.testCasesService.exportTestCases(projectId, user.companyId);
  }

  @Post('import')
  importTestCases(
    @Param('projectId') projectId: string,
    @CurrentUser() user: { companyId: string; userId: string },
    @Body() body: { rows: Array<Record<string, any>> },
  ) {
    return this.testCasesImportService.importTestCases(
      projectId,
      user.companyId,
      user.userId,
      body.rows ?? [],
    );
  }

  @Get(':id')
  getTestCase(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @CurrentUser() user: { companyId: string },
  ) {
    return this.testCasesService.getTestCase(id, projectId, user.companyId);
  }

  @Patch(':id')
  updateTestCase(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @CurrentUser() user: { companyId: string; userId: string; role: import('@prisma/client').UserRole },
    @Body() dto: UpdateTestCaseDto,
  ) {
    return this.testCasesService.updateTestCase(
      id,
      projectId,
      user.companyId,
      user.userId,
      user.role,
      dto,
    );
  }

  @Delete(':id')
  deleteTestCase(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @CurrentUser() user: { companyId: string; userId: string; role: import('@prisma/client').UserRole },
  ) {
    return this.testCasesService.deleteTestCase(id, projectId, user.companyId, user.userId, user.role);
  }

  @Post(':id/duplicate')
  duplicateTestCase(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @CurrentUser() user: { companyId: string; userId: string },
  ) {
    return this.testCasesService.duplicateTestCase(id, projectId, user.companyId, user.userId);
  }

  @Patch('bulk-status')
  bulkUpdateStatus(
    @Param('projectId') projectId: string,
    @CurrentUser() user: { companyId: string; userId: string; role: import('@prisma/client').UserRole },
    @Body() dto: BulkUpdateStatusDto,
  ) {
    return this.testCasesService.bulkUpdateStatus(
      projectId,
      user.companyId,
      user.userId,
      user.role,
      dto.ids,
      dto.status,
    );
  }

  @Post(':id/approve')
  approveTestCase(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @CurrentUser() user: { companyId: string; userId: string; role: import('@prisma/client').UserRole },
  ) {
    return this.testCasesService.approveTestCase(
      id,
      projectId,
      user.companyId,
      user.userId,
      user.role,
    );
  }
}
