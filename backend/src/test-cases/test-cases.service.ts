import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  TestStatus,
  UserRole,
} from '@prisma/client';
import { PLAN_LIMITS } from '../common/utils/plan-limits.util';
import { generateTestCaseId } from '../common/utils/id-generator.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTestCaseDto } from './dto/create-test-case.dto';
import { FilterTestCasesDto } from './dto/filter-test-cases.dto';
import { UpdateTestCaseDto } from './dto/update-test-case.dto';

@Injectable()
export class TestCasesService {
  constructor(private readonly prisma: PrismaService) {}

  async createTestCase(
    projectId: string,
    companyId: string,
    createdById: string,
    dto: CreateTestCaseDto,
  ) {
    await this.ensureProject(projectId, companyId);
    await this.ensureTestCaseLimit(projectId, companyId);
    const testCaseId = await generateTestCaseId(this.prisma, projectId);
    const testCase = await this.prisma.testCase.create({
      data: {
        projectId,
        companyId,
        testCaseId,
        title: dto.title.trim(),
        description: dto.description || null,
        preConditions: dto.preConditions || null,
        testSteps: dto.testSteps as unknown as Prisma.InputJsonValue,
        expectedResult: dto.expectedResult || null,
        suiteId: dto.suiteId || null,
        priority: dto.priority,
        severity: dto.severity,
        testType: dto.testType,
        tags: dto.tags ?? [],
        assignedToId: dto.assignedToId || null,
        createdById,
      },
    });

    await this.logActivity(companyId, projectId, createdById, 'testcase.created', testCase.id, testCase.testCaseId);
    if (dto.assignedToId) {
      await this.createAssignmentNotification(companyId, projectId, createdById, dto.assignedToId, testCase);
    }
    return testCase;
  }

  async getTestCases(projectId: string, companyId: string, filterDto: FilterTestCasesDto) {
    const where: Prisma.TestCaseWhereInput = {
      projectId,
      companyId,
      ...(filterDto.search
        ? {
            OR: [
              { title: { contains: filterDto.search, mode: 'insensitive' } },
              { description: { contains: filterDto.search, mode: 'insensitive' } },
              { testCaseId: { contains: filterDto.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(filterDto.status ? { status: filterDto.status } : {}),
      ...(filterDto.priority ? { priority: filterDto.priority } : {}),
      ...(filterDto.severity ? { severity: filterDto.severity } : {}),
      ...(filterDto.testType ? { testType: filterDto.testType } : {}),
      ...(filterDto.suiteId ? { suiteId: filterDto.suiteId } : {}),
      ...(filterDto.assignedToId ? { assignedToId: filterDto.assignedToId } : {}),
      ...(filterDto.tags?.length ? { tags: { hasSome: filterDto.tags } } : {}),
    };
    const page = filterDto.page ?? 1;
    const limit = filterDto.limit ?? 20;
    const skip = (page - 1) * limit;

    const [total, items] = await this.prisma.$transaction([
      this.prisma.testCase.count({ where }),
      this.prisma.testCase.findMany({
        where,
        include: {
          suite: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, displayName: true } },
          createdBy: { select: { id: true, displayName: true } },
          _count: { select: { comments: true } },
        },
        skip,
        take: limit,
        orderBy: this.buildSort(filterDto.sortBy, filterDto.sortOrder),
      }),
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getTestCase(id: string, projectId: string, companyId: string) {
    const testCase = await this.prisma.testCase.findFirst({
      where: { id, projectId, companyId },
      include: {
        suite: true,
        assignedTo: { select: { id: true, displayName: true, email: true } },
        createdBy: { select: { id: true, displayName: true, email: true } },
        approvedBy: { select: { id: true, displayName: true } },
        comments: { orderBy: { createdAt: 'desc' }, take: 20 },
        runResults: { orderBy: { createdAt: 'desc' }, take: 20 },
        _count: { select: { comments: true, runResults: true } },
      },
    });
    if (!testCase) throw new NotFoundException('Test case not found.');
    return testCase;
  }

  async updateTestCase(
    id: string,
    projectId: string,
    companyId: string,
    updatedById: string,
    role: UserRole,
    dto: UpdateTestCaseDto,
  ) {
    this.ensureQAManagerOrAbove(role);
    const existing = await this.prisma.testCase.findFirst({
      where: { id, projectId, companyId },
    });
    if (!existing) throw new NotFoundException('Test case not found.');

    const changed = this.extractChanges(existing as any, dto);
    const significantFields = ['title', 'description', 'preConditions', 'testSteps', 'expectedResult', 'suiteId'];
    const shouldIncrementVersion = Object.keys(changed).some((k) => significantFields.includes(k));

    const updated = await this.prisma.testCase.update({
      where: { id },
      data: {
        ...this.buildUpdateData(dto),
        ...(shouldIncrementVersion ? { version: { increment: 1 } } : {}),
      },
    });

    if (changed.status) {
      await this.logActivity(companyId, projectId, updatedById, 'testcase.status_changed', id, existing.testCaseId, changed.status);
    } else if (Object.keys(changed).length) {
      await this.logActivity(companyId, projectId, updatedById, 'testcase.updated', id, existing.testCaseId, changed);
    }

    if (changed.assignedToId && dto.assignedToId) {
      await this.createAssignmentNotification(companyId, projectId, updatedById, dto.assignedToId, updated);
    }

    return updated;
  }

  async deleteTestCase(
    id: string,
    projectId: string,
    companyId: string,
    userId: string,
    role: UserRole,
  ) {
    this.ensureQAManagerOrAbove(role);
    const existing = await this.prisma.testCase.findFirst({
      where: { id, projectId, companyId },
    });
    if (!existing) throw new NotFoundException('Test case not found.');
    await this.prisma.testCase.delete({ where: { id } });
    await this.logActivity(companyId, projectId, userId, 'testcase.deleted', id, existing.testCaseId);
    return { message: 'Test case deleted.' };
  }

  async duplicateTestCase(
    id: string,
    projectId: string,
    companyId: string,
    userId: string,
  ) {
    const existing = await this.prisma.testCase.findFirst({
      where: { id, projectId, companyId },
    });
    if (!existing) throw new NotFoundException('Test case not found.');
    const testCaseId = await generateTestCaseId(this.prisma, projectId);
    const duplicated = await this.prisma.testCase.create({
      data: {
        projectId: existing.projectId,
        companyId: existing.companyId,
        suiteId: existing.suiteId,
        testCaseId,
        title: `Copy of ${existing.title}`,
        description: existing.description,
        preConditions: existing.preConditions,
        testSteps: existing.testSteps as unknown as Prisma.InputJsonValue,
        expectedResult: existing.expectedResult,
        status: TestStatus.NOT_RUN,
        priority: existing.priority,
        severity: existing.severity,
        testType: existing.testType,
        tags: existing.tags,
        assignedToId: existing.assignedToId,
        createdById: userId,
        isApproved: false,
        approvedById: null,
        version: 1,
      },
    });
    await this.logActivity(companyId, projectId, userId, 'testcase.duplicated', duplicated.id, duplicated.testCaseId);
    return duplicated;
  }

  async bulkUpdateStatus(
    projectId: string,
    companyId: string,
    userId: string,
    role: UserRole,
    ids: string[],
    status: TestStatus,
  ) {
    this.ensureQAManagerOrAbove(role);
    const result = await this.prisma.testCase.updateMany({
      where: { projectId, companyId, id: { in: ids } },
      data: { status },
    });
    await this.logActivity(companyId, projectId, userId, 'testcase.bulk_status_changed', 'bulk', 'bulk', {
      ids,
      status,
      updatedCount: result.count,
    });
    return { updated: result.count };
  }

  async approveTestCase(
    id: string,
    projectId: string,
    companyId: string,
    userId: string,
    role: UserRole,
  ) {
    this.ensureQAManagerOrAbove(role);
    const testCase = await this.prisma.testCase.findFirst({
      where: { id, projectId, companyId },
    });
    if (!testCase) throw new NotFoundException('Test case not found.');
    return this.prisma.testCase.update({
      where: { id },
      data: { isApproved: true, approvedById: userId },
    });
  }

  async exportTestCases(projectId: string, companyId: string) {
    const testCases = await this.prisma.testCase.findMany({
      where: { projectId, companyId },
      include: { suite: true, assignedTo: true, createdBy: true },
      orderBy: [{ createdAt: 'desc' }],
    });
    return testCases.map((tc) => ({
      testCaseId: tc.testCaseId,
      title: tc.title,
      description: tc.description,
      preConditions: tc.preConditions,
      testSteps: tc.testSteps,
      expectedResult: tc.expectedResult,
      status: tc.status,
      priority: tc.priority,
      severity: tc.severity,
      testType: tc.testType,
      tags: tc.tags,
      suite: tc.suite?.name ?? '',
      assignedTo: tc.assignedTo?.displayName ?? '',
      createdBy: tc.createdBy?.displayName ?? '',
      approved: tc.isApproved,
      createdAt: tc.createdAt,
      updatedAt: tc.updatedAt,
    }));
  }

  private buildSort(sortBy = 'createdAt', sortOrder: 'asc' | 'desc' = 'desc') {
    if (sortBy === 'testCaseId') return [{ testCaseId: sortOrder }] as Prisma.TestCaseOrderByWithRelationInput[];
    return [{ [sortBy]: sortOrder }] as Prisma.TestCaseOrderByWithRelationInput[];
  }

  private buildUpdateData(dto: UpdateTestCaseDto): Prisma.TestCaseUpdateInput {
    return {
      ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
      ...(dto.description !== undefined ? { description: dto.description || null } : {}),
      ...(dto.preConditions !== undefined ? { preConditions: dto.preConditions || null } : {}),
      ...(dto.testSteps !== undefined
        ? { testSteps: dto.testSteps as unknown as Prisma.InputJsonValue }
        : {}),
      ...(dto.expectedResult !== undefined ? { expectedResult: dto.expectedResult || null } : {}),
      ...(dto.suiteId !== undefined ? { suiteId: dto.suiteId || null } : {}),
      ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
      ...(dto.severity !== undefined ? { severity: dto.severity } : {}),
      ...(dto.testType !== undefined ? { testType: dto.testType } : {}),
      ...(dto.tags !== undefined ? { tags: dto.tags } : {}),
      ...(dto.assignedToId !== undefined ? { assignedToId: dto.assignedToId || null } : {}),
    };
  }

  private extractChanges(existing: Record<string, unknown>, dto: UpdateTestCaseDto) {
    const changed: Record<string, { from: unknown; to: unknown }> = {};
    for (const [key, value] of Object.entries(dto)) {
      if ((existing as any)[key] !== value) changed[key] = { from: (existing as any)[key], to: value };
    }
    return changed;
  }

  private async ensureProject(projectId: string, companyId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, companyId, isArchived: false },
      select: { id: true },
    });
    if (!project) throw new BadRequestException('Project not found.');
  }

  private async ensureTestCaseLimit(projectId: string, companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { plan: true, maxTestCasesPerProject: true },
    });
    if (!company) throw new BadRequestException('Company not found.');
    const count = await this.prisma.testCase.count({ where: { projectId, companyId } });
    const max = company.maxTestCasesPerProject || PLAN_LIMITS[company.plan].maxTestCasesPerProject;
    if (count >= max) throw new BadRequestException('Test case limit reached for current plan.');
  }

  private ensureQAManagerOrAbove(role: UserRole) {
    if (!(role === UserRole.ADMIN || role === UserRole.QA_MANAGER)) {
      throw new ForbiddenException('Only QA Manager or Admin can perform this action.');
    }
  }

  private async logActivity(
    companyId: string,
    projectId: string,
    actorId: string,
    action: string,
    entityId: string,
    entityRef?: string,
    changes?: unknown,
  ) {
    await this.prisma.activityLog.create({
      data: {
        companyId,
        projectId,
        actorId,
        action,
        entityType: 'testCase',
        entityId,
        entityRef,
        changes: (changes ?? undefined) as Prisma.InputJsonValue,
      },
    });
  }

  private async createAssignmentNotification(
    companyId: string,
    projectId: string,
    senderId: string,
    recipientId: string,
    testCase: { id: string; testCaseId: string; title: string },
  ) {
    if (senderId === recipientId) return;
    await this.prisma.notification.create({
      data: {
        companyId,
        projectId,
        senderId,
        recipientId,
        type: 'testcase.assigned',
        title: `Assigned: ${testCase.testCaseId}`,
        message: `You were assigned "${testCase.title}".`,
        entityType: 'testCase',
        entityId: testCase.id,
      },
    });
  }
}
