import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PLAN_LIMITS } from '../common/utils/plan-limits.util';
import { generateTestCaseId } from '../common/utils/id-generator.util';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TestCasesImportService {
  constructor(private readonly prisma: PrismaService) {}

  async importTestCases(
    projectId: string,
    companyId: string,
    userId: string,
    rows: Array<Record<string, any>>,
  ) {
    if (!Array.isArray(rows)) throw new BadRequestException('rows must be an array.');

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { plan: true, maxTestCasesPerProject: true },
    });
    if (!company) throw new BadRequestException('Company not found.');

    const used = await this.prisma.testCase.count({ where: { projectId, companyId } });
    const max = company.maxTestCasesPerProject || PLAN_LIMITS[company.plan].maxTestCasesPerProject;
    if (used + rows.length > max) {
      throw new BadRequestException('Import exceeds current test case plan limit.');
    }

    let currentIdNum = Number((await generateTestCaseId(this.prisma, projectId)).replace(/\D/g, '')) - 1;
    const errors: Array<{ row: number; message: string }> = [];
    const valid: Prisma.TestCaseCreateManyInput[] = [];

    rows.forEach((row, index) => {
      const title = String(row.title ?? '').trim();
      const testSteps = Array.isArray(row.testSteps) ? row.testSteps : [];
      if (!title) {
        errors.push({ row: index + 1, message: 'Missing title' });
        return;
      }
      if (!testSteps.length) {
        errors.push({ row: index + 1, message: 'Missing test steps' });
        return;
      }
      currentIdNum += 1;
      valid.push({
        projectId,
        companyId,
        testCaseId: `TC-${String(currentIdNum).padStart(3, '0')}`,
        title,
        description: row.description || null,
        preConditions: row.preConditions || null,
        testSteps: testSteps as Prisma.InputJsonValue,
        expectedResult: row.expectedResult || null,
        suiteId: row.suiteId || null,
        priority: row.priority || 'MEDIUM',
        severity: row.severity || 'MINOR',
        testType: row.testType || 'FUNCTIONAL',
        tags: Array.isArray(row.tags) ? row.tags : [],
        assignedToId: row.assignedToId || null,
        createdById: userId,
      });
    });

    if (valid.length) {
      await this.prisma.testCase.createMany({ data: valid, skipDuplicates: true });
      await this.prisma.activityLog.create({
        data: {
          companyId,
          projectId,
          actorId: userId,
          action: 'testcase.imported',
          entityType: 'testCase',
          entityId: 'import',
          entityRef: 'import',
          metadata: { created: valid.length, failed: errors.length } as Prisma.InputJsonValue,
        },
      });
    }

    return {
      created: valid.length,
      failed: errors.length,
      errors,
    };
  }
}
