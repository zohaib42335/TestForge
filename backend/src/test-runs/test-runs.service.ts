import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RunStatus, TestStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRunDto } from './dto/create-run.dto';
import { UpdateResultDto } from './dto/update-result.dto';

@Injectable()
export class TestRunsService {
  constructor(private readonly prisma: PrismaService) {}

  async createRun(
    projectId: string,
    companyId: string,
    createdById: string,
    role: UserRole,
    dto: CreateRunDto,
  ) {
    this.ensureQAManagerOrAbove(role);
    const project = await this.ensureProject(projectId, companyId);
    const uniqueIds = Array.from(new Set(dto.testCaseIds || []));
    if (!uniqueIds.length) {
      throw new BadRequestException('At least one test case is required.');
    }
    const cases = await this.prisma.testCase.findMany({
      where: { id: { in: uniqueIds }, projectId, companyId },
      select: { id: true },
    });
    if (cases.length !== uniqueIds.length) {
      throw new BadRequestException('Some test cases do not belong to this project.');
    }

    const run = await this.prisma.$transaction(async (tx) => {
      const created = await tx.testRun.create({
        data: {
          projectId,
          companyId,
          name: dto.name.trim(),
          description: dto.description?.trim() || null,
          createdById,
          totalCases: uniqueIds.length,
          notRunCount: uniqueIds.length,
        },
      });

      await tx.testRunResult.createMany({
        data: uniqueIds.map((testCaseId) => ({
          runId: created.id,
          testCaseId,
          companyId,
          result: TestStatus.NOT_RUN,
        })),
      });

      await tx.activityLog.create({
        data: {
          companyId,
          projectId,
          actorId: createdById,
          action: 'testrun.created',
          entityType: 'testRun',
          entityId: created.id,
          entityRef: created.name,
          metadata: { totalCases: uniqueIds.length } as Prisma.InputJsonValue,
        },
      });

      return created;
    });

    return run;
  }

  async getRuns(projectId: string, companyId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { projectId, companyId };
    const [total, runs] = await this.prisma.$transaction([
      this.prisma.testRun.count({ where }),
      this.prisma.testRun.findMany({
        where,
        include: {
          createdBy: { select: { id: true, displayName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const items = runs.map((run) => {
      const done = run.passCount + run.failCount + run.blockedCount + run.skippedCount;
      const progressPercentage = run.totalCases > 0 ? Math.round((done / run.totalCases) * 100) : 0;
      return {
        ...run,
        creatorName: run.createdBy?.displayName || 'Unknown',
        progressPercentage,
      };
    });

    return {
      items,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getRun(runId: string, projectId: string, companyId: string) {
    const run = await this.prisma.testRun.findFirst({
      where: { id: runId, projectId, companyId },
      include: {
        createdBy: { select: { id: true, displayName: true } },
        results: {
          include: {
            testCase: {
              select: {
                id: true,
                testCaseId: true,
                title: true,
                priority: true,
                suite: { select: { id: true, name: true } },
              },
            },
            executedBy: { select: { id: true, displayName: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!run) {
      throw new NotFoundException('Run not found.');
    }
    return run;
  }

  async startRun(runId: string, projectId: string, companyId: string, userId: string) {
    const run = await this.prisma.testRun.findFirst({
      where: { id: runId, projectId, companyId },
    });
    if (!run) throw new NotFoundException('Run not found.');

    const updated = await this.prisma.testRun.update({
      where: { id: runId },
      data: {
        status: RunStatus.IN_PROGRESS,
        startedAt: run.startedAt || new Date(),
      },
    });

    await this.prisma.activityLog.create({
      data: {
        companyId,
        projectId,
        actorId: userId,
        action: 'testrun.started',
        entityType: 'testRun',
        entityId: runId,
        entityRef: run.name,
      },
    });

    return updated;
  }

  async updateResult(
    runId: string,
    resultId: string,
    projectId: string,
    companyId: string,
    executedById: string,
    dto: UpdateResultDto,
  ) {
    await this.ensureProjectMember(projectId, companyId, executedById);

    const run = await this.prisma.testRun.findFirst({
      where: { id: runId, projectId, companyId },
    });
    if (!run) throw new NotFoundException('Run not found.');

    const result = await this.prisma.testRunResult.findFirst({
      where: { id: resultId, runId, companyId },
    });
    if (!result) throw new NotFoundException('Run result not found.');

    const updatedResult = await this.prisma.testRunResult.update({
      where: { id: resultId },
      data: {
        result: dto.result,
        notes: dto.notes?.trim() || null,
        executedById,
        executedAt: new Date(),
      },
    });

    const aggregates = await this.prisma.testRunResult.groupBy({
      by: ['result'],
      where: { runId, companyId },
      _count: { _all: true },
    });
    const countMap = new Map(aggregates.map((x) => [x.result, x._count._all]));
    const passCount = countMap.get(TestStatus.PASS) ?? 0;
    const failCount = countMap.get(TestStatus.FAIL) ?? 0;
    const blockedCount = countMap.get(TestStatus.BLOCKED) ?? 0;
    const skippedCount = countMap.get(TestStatus.SKIPPED) ?? 0;
    const notRunCount = countMap.get(TestStatus.NOT_RUN) ?? 0;

    const runUpdateData: Prisma.TestRunUpdateInput = {
      passCount,
      failCount,
      blockedCount,
      skippedCount,
      notRunCount,
    };
    if (notRunCount === 0) {
      runUpdateData.status = RunStatus.COMPLETED;
      runUpdateData.completedAt = new Date();
    } else if (run.status === RunStatus.PENDING) {
      runUpdateData.status = RunStatus.IN_PROGRESS;
      runUpdateData.startedAt = run.startedAt || new Date();
    }

    await this.prisma.testRun.update({
      where: { id: runId },
      data: runUpdateData,
    });

    await this.prisma.activityLog.create({
      data: {
        companyId,
        projectId,
        actorId: executedById,
        action: 'testrun.result_updated',
        entityType: 'testRun',
        entityId: runId,
        entityRef: run.name,
        changes: {
          resultId,
          from: result.result,
          to: dto.result,
          notes: dto.notes || null,
        } as Prisma.InputJsonValue,
      },
    });

    return updatedResult;
  }

  async deleteRun(
    runId: string,
    projectId: string,
    companyId: string,
    userId: string,
    role: UserRole,
  ) {
    this.ensureQAManagerOrAbove(role);
    const run = await this.prisma.testRun.findFirst({
      where: { id: runId, projectId, companyId },
    });
    if (!run) throw new NotFoundException('Run not found.');
    await this.prisma.testRun.delete({ where: { id: runId } });
    await this.prisma.activityLog.create({
      data: {
        companyId,
        projectId,
        actorId: userId,
        action: 'testrun.deleted',
        entityType: 'testRun',
        entityId: runId,
        entityRef: run.name,
      },
    });
    return { message: 'Run deleted.' };
  }

  async getRunStats(runId: string, projectId: string, companyId: string) {
    const run = await this.prisma.testRun.findFirst({
      where: { id: runId, projectId, companyId },
      include: {
        results: {
          include: {
            testCase: {
              select: {
                id: true,
                testCaseId: true,
                title: true,
                priority: true,
                suite: { select: { name: true } },
              },
            },
          },
        },
      },
    });
    if (!run) throw new NotFoundException('Run not found.');

    const total = run.totalCases || run.results.length;
    const completed = run.passCount + run.failCount + run.blockedCount + run.skippedCount;
    const passRate = total > 0 ? Math.round((run.passCount / total) * 100) : 0;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const byPriority = run.results.reduce<Record<string, number>>((acc, row) => {
      const key = row.testCase?.priority || 'UNKNOWN';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const bySuite = run.results.reduce<Record<string, number>>((acc, row) => {
      const key = row.testCase?.suite?.name || 'Unassigned';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const failedCases = run.results
      .filter((row) => row.result === TestStatus.FAIL || row.result === TestStatus.BLOCKED)
      .map((row) => ({
        id: row.id,
        result: row.result,
        notes: row.notes,
        testCaseId: row.testCase?.testCaseId,
        title: row.testCase?.title,
        priority: row.testCase?.priority,
        suite: row.testCase?.suite?.name || null,
      }));

    return {
      passRate,
      completionRate,
      byPriority,
      bySuite,
      failedCases,
      counts: {
        total,
        pass: run.passCount,
        fail: run.failCount,
        blocked: run.blockedCount,
        skipped: run.skippedCount,
        notRun: run.notRunCount,
      },
    };
  }

  private ensureQAManagerOrAbove(role: UserRole) {
    if (!(role === UserRole.ADMIN || role === UserRole.QA_MANAGER)) {
      throw new ForbiddenException('Only QA Manager or Admin can perform this action.');
    }
  }

  private async ensureProject(projectId: string, companyId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, companyId },
      select: { id: true },
    });
    if (!project) throw new NotFoundException('Project not found.');
    return project;
  }

  private async ensureProjectMember(projectId: string, companyId: string, userId: string) {
    const membership = await this.prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
        project: { companyId },
      },
      select: { id: true },
    });
    if (!membership) {
      throw new ForbiddenException('You are not a member of this project.');
    }
  }
}
