import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TestStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverviewStats(projectId: string, companyId: string) {
    await this.ensureProject(projectId, companyId);

    const [totalCases, byStatus, byPriority, byTestType, recentFailures, recentActivity, bySuiteRaw] =
      await Promise.all([
        this.prisma.testCase.count({ where: { projectId, companyId } }),
        this.prisma.testCase.groupBy({
          by: ['status'],
          where: { projectId, companyId },
          _count: { _all: true },
        }),
        this.prisma.testCase.groupBy({
          by: ['priority'],
          where: { projectId, companyId },
          _count: { _all: true },
        }),
        this.prisma.testCase.groupBy({
          by: ['testType'],
          where: { projectId, companyId },
          _count: { _all: true },
        }),
        this.prisma.testCase.findMany({
          where: { projectId, companyId, status: TestStatus.FAIL },
          orderBy: { updatedAt: 'desc' },
          take: 5,
          select: {
            id: true,
            testCaseId: true,
            title: true,
            priority: true,
            severity: true,
            updatedAt: true,
            suite: { select: { name: true } },
          },
        }),
        this.prisma.activityLog.findMany({
          where: { companyId, projectId },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            actor: { select: { id: true, displayName: true, role: true } },
          },
        }),
        this.prisma.$queryRaw<
          Array<{
            suiteName: string;
            total: number;
            pass: number;
            fail: number;
            blocked: number;
          }>
        >(Prisma.sql`
          SELECT
            COALESCE(ts.name, 'Unassigned') as "suiteName",
            COUNT(tc.id)::int as total,
            SUM(CASE WHEN tc.status = 'PASS' THEN 1 ELSE 0 END)::int as pass,
            SUM(CASE WHEN tc.status = 'FAIL' THEN 1 ELSE 0 END)::int as fail,
            SUM(CASE WHEN tc.status = 'BLOCKED' THEN 1 ELSE 0 END)::int as blocked
          FROM test_cases tc
          LEFT JOIN test_suites ts ON ts.id = tc."suiteId"
          WHERE tc."projectId" = ${projectId}
            AND tc."companyId" = ${companyId}
          GROUP BY COALESCE(ts.name, 'Unassigned')
          ORDER BY total DESC, "suiteName" ASC
        `),
      ]);

    const statusMap = new Map(byStatus.map((row) => [row.status, row._count._all]));
    const passCount = statusMap.get(TestStatus.PASS) ?? 0;
    const failCount = statusMap.get(TestStatus.FAIL) ?? 0;
    const blockedCount = statusMap.get(TestStatus.BLOCKED) ?? 0;
    const notRunCount = statusMap.get(TestStatus.NOT_RUN) ?? 0;
    const passRate = totalCases > 0 ? Math.round((passCount / totalCases) * 100) : 0;

    return {
      totalCases,
      passCount,
      failCount,
      blockedCount,
      notRunCount,
      passRate,
      byPriority: byPriority.reduce<Record<string, number>>((acc, row) => {
        acc[row.priority.toLowerCase()] = row._count._all;
        return acc;
      }, {}),
      bySuite: bySuiteRaw,
      byTestType: byTestType.reduce<Record<string, number>>((acc, row) => {
        acc[row.testType.toLowerCase()] = row._count._all;
        return acc;
      }, {}),
      recentFailures,
      recentActivity,
    };
  }

  async getExecutionReport(runId: string, projectId: string, companyId: string) {
    const run = await this.prisma.testRun.findFirst({
      where: { id: runId, projectId, companyId },
      include: {
        createdBy: { select: { id: true, displayName: true } },
      },
    });
    if (!run) throw new NotFoundException('Run not found.');

    const [bySuite, byPriority, byAssignee, failedCases] = await Promise.all([
      this.prisma.$queryRaw<
        Array<{ suiteName: string; total: number; pass: number; fail: number; blocked: number }>
      >(Prisma.sql`
        SELECT
          COALESCE(ts.name, 'Unassigned') as "suiteName",
          COUNT(trr.id)::int as total,
          SUM(CASE WHEN trr.result = 'PASS' THEN 1 ELSE 0 END)::int as pass,
          SUM(CASE WHEN trr.result = 'FAIL' THEN 1 ELSE 0 END)::int as fail,
          SUM(CASE WHEN trr.result = 'BLOCKED' THEN 1 ELSE 0 END)::int as blocked
        FROM test_run_results trr
        JOIN test_cases tc ON tc.id = trr."testCaseId"
        LEFT JOIN test_suites ts ON ts.id = tc."suiteId"
        WHERE trr."runId" = ${runId}
          AND trr."companyId" = ${companyId}
        GROUP BY COALESCE(ts.name, 'Unassigned')
        ORDER BY total DESC, "suiteName" ASC
      `),
      this.prisma.$queryRaw<Array<{ priority: string; total: number }>>(Prisma.sql`
        SELECT
          tc.priority::text as priority,
          COUNT(trr.id)::int as total
        FROM test_run_results trr
        JOIN test_cases tc ON tc.id = trr."testCaseId"
        WHERE trr."runId" = ${runId}
          AND trr."companyId" = ${companyId}
        GROUP BY tc.priority
        ORDER BY total DESC
      `),
      this.prisma.$queryRaw<Array<{ name: string; pass: number; fail: number; blocked: number }>>(
        Prisma.sql`
          SELECT
            COALESCE(u."displayName", 'Unassigned') as name,
            SUM(CASE WHEN trr.result = 'PASS' THEN 1 ELSE 0 END)::int as pass,
            SUM(CASE WHEN trr.result = 'FAIL' THEN 1 ELSE 0 END)::int as fail,
            SUM(CASE WHEN trr.result = 'BLOCKED' THEN 1 ELSE 0 END)::int as blocked
          FROM test_run_results trr
          LEFT JOIN users u ON u.id = trr."executedById"
          WHERE trr."runId" = ${runId}
            AND trr."companyId" = ${companyId}
          GROUP BY COALESCE(u."displayName", 'Unassigned')
          ORDER BY name ASC
        `,
      ),
      this.prisma.testRunResult.findMany({
        where: {
          runId,
          companyId,
          result: { in: [TestStatus.FAIL, TestStatus.BLOCKED] },
        },
        select: {
          id: true,
          notes: true,
          result: true,
          testCase: {
            select: {
              testCaseId: true,
              title: true,
              suite: { select: { name: true } },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    const completed = run.passCount + run.failCount + run.blockedCount + run.skippedCount;
    const passRate = run.totalCases > 0 ? Math.round((run.passCount / run.totalCases) * 100) : 0;
    const completionRate = run.totalCases > 0 ? Math.round((completed / run.totalCases) * 100) : 0;
    const duration =
      run.startedAt && run.completedAt
        ? Math.max(
            0,
            Math.round((run.completedAt.getTime() - run.startedAt.getTime()) / (1000 * 60)),
          )
        : null;

    return {
      run,
      passRate,
      completionRate,
      bySuite,
      byPriority: byPriority.reduce<Record<string, number>>((acc, row) => {
        acc[row.priority.toLowerCase()] = row.total;
        return acc;
      }, {}),
      byAssignee,
      failedCases: failedCases.map((row) => ({
        id: row.id,
        testCaseId: row.testCase?.testCaseId,
        title: row.testCase?.title,
        notes: row.notes,
        suite: row.testCase?.suite?.name || 'Unassigned',
        result: row.result,
      })),
      duration,
    };
  }

  async getCoverageReport(projectId: string, companyId: string) {
    await this.ensureProject(projectId, companyId);

    const [totalSuites, suitesWithCases, suites, untestedSuites] = await Promise.all([
      this.prisma.testSuite.count({ where: { projectId, companyId } }),
      this.prisma.testSuite.count({
        where: {
          projectId,
          companyId,
          testCases: { some: {} },
        },
      }),
      this.prisma.$queryRaw<
        Array<{ name: string; caseCount: number; passRate: number; lastExecuted: Date | null }>
      >(Prisma.sql`
        SELECT
          ts.name as name,
          COUNT(tc.id)::int as "caseCount",
          COALESCE(
            ROUND(
              (
                SUM(CASE WHEN tc.status = 'PASS' THEN 1 ELSE 0 END)::numeric
                / NULLIF(COUNT(tc.id), 0)
              ) * 100
            ),
            0
          )::int as "passRate",
          MAX(trr."executedAt") as "lastExecuted"
        FROM test_suites ts
        LEFT JOIN test_cases tc ON tc."suiteId" = ts.id
        LEFT JOIN test_run_results trr ON trr."testCaseId" = tc.id
        WHERE ts."projectId" = ${projectId}
          AND ts."companyId" = ${companyId}
        GROUP BY ts.id, ts.name
        ORDER BY ts.name ASC
      `),
      this.prisma.testSuite.findMany({
        where: {
          projectId,
          companyId,
          testCases: { none: {} },
        },
        select: { name: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    const coveragePercent =
      totalSuites > 0 ? Math.round((suitesWithCases / totalSuites) * 100) : 0;

    return {
      totalSuites,
      suitesWithCases,
      coveragePercent,
      suites,
      untestedSuites: untestedSuites.map((s) => s.name),
    };
  }

  async getTrendData(projectId: string, companyId: string, days: number) {
    await this.ensureProject(projectId, companyId);

    const rows = await this.prisma.$queryRaw<
      Array<{ date: Date; passRate: number; totalExecuted: number }>
    >(Prisma.sql`
      SELECT
        DATE_TRUNC('day', trr."executedAt")::date as date,
        ROUND(
          (
            SUM(CASE WHEN trr.result = 'PASS' THEN 1 ELSE 0 END)::numeric
            / NULLIF(COUNT(trr.id), 0)
          ) * 100
        )::int as "passRate",
        COUNT(trr.id)::int as "totalExecuted"
      FROM test_run_results trr
      JOIN test_runs tr ON tr.id = trr."runId"
      WHERE tr."projectId" = ${projectId}
        AND trr."companyId" = ${companyId}
        AND trr."executedAt" IS NOT NULL
        AND trr."executedAt" >= NOW() - (${days}::text || ' days')::interval
      GROUP BY DATE_TRUNC('day', trr."executedAt")::date
      ORDER BY date ASC
    `);

    return rows.map((row) => ({
      date: row.date.toISOString().slice(0, 10),
      passRate: Number(row.passRate) || 0,
      totalExecuted: Number(row.totalExecuted) || 0,
    }));
  }

  private async ensureProject(projectId: string, companyId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, companyId },
      select: { id: true },
    });
    if (!project) throw new NotFoundException('Project not found.');
    return project;
  }
}
