import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSuiteDto } from './dto/create-suite.dto';

@Injectable()
export class TestSuitesService {
  constructor(private readonly prisma: PrismaService) {}

  async createSuite(
    projectId: string,
    companyId: string,
    createdById: string,
    dto: CreateSuiteDto,
  ) {
    await this.ensureProjectBelongsToCompany(projectId, companyId);
    return this.prisma.testSuite.create({
      data: {
        projectId,
        companyId,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        createdById,
      },
    });
  }

  async getSuites(projectId: string, companyId: string) {
    await this.ensureProjectBelongsToCompany(projectId, companyId);
    const suites = await this.prisma.testSuite.findMany({
      where: { projectId, companyId },
      orderBy: { createdAt: 'desc' },
    });
    const counts = await this.prisma.testCase.groupBy({
      by: ['suiteId'],
      where: { projectId, companyId, suiteId: { not: null } },
      _count: { _all: true },
    });
    const countMap = new Map(
      counts
        .filter((x) => x.suiteId)
        .map((x) => [String(x.suiteId), x._count._all]),
    );
    return suites.map((suite) => ({
      ...suite,
      testCaseCount: countMap.get(suite.id) ?? 0,
    }));
  }

  async updateSuite(
    suiteId: string,
    companyId: string,
    role: UserRole,
    dto: CreateSuiteDto,
  ) {
    this.ensureQAManagerOrAbove(role);
    const suite = await this.prisma.testSuite.findFirst({
      where: { id: suiteId, companyId },
    });
    if (!suite) {
      throw new NotFoundException('Suite not found.');
    }
    return this.prisma.testSuite.update({
      where: { id: suiteId },
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
      },
    });
  }

  async deleteSuite(
    suiteId: string,
    companyId: string,
    role: UserRole,
  ) {
    this.ensureQAManagerOrAbove(role);
    const suite = await this.prisma.testSuite.findFirst({
      where: { id: suiteId, companyId },
    });
    if (!suite) {
      throw new NotFoundException('Suite not found.');
    }

    await this.prisma.testCase.updateMany({
      where: { suiteId, projectId: suite.projectId, companyId },
      data: { suiteId: null },
    });
    await this.prisma.testSuite.delete({ where: { id: suiteId } });
    return { message: 'Suite deleted and test cases unassigned.' };
  }

  private ensureQAManagerOrAbove(role: UserRole) {
    if (!(role === UserRole.ADMIN || role === UserRole.QA_MANAGER)) {
      throw new ForbiddenException('Only QA Manager or Admin can perform this action.');
    }
  }

  private async ensureProjectBelongsToCompany(projectId: string, companyId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, companyId },
      select: { id: true },
    });
    if (!project) {
      throw new BadRequestException('Project not found in company.');
    }
  }
}
