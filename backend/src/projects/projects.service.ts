import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async createProject(companyId: string, createdById: string, dto: CreateProjectDto) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException('Company not found.');
    }

    const projectCount = await this.prisma.project.count({
      where: { companyId, isArchived: false },
    });
    if (projectCount >= company.maxProjects) {
      throw new BadRequestException('Project limit reached for your current plan.');
    }

    const creator = await this.prisma.user.findUnique({ where: { id: createdById } });
    if (!creator || creator.companyId !== companyId) {
      throw new NotFoundException('Creator not found in company.');
    }

    const project = await this.prisma.project.create({
      data: {
        companyId,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        createdById,
      },
    });

    await this.prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: createdById,
        projectRole: creator.role,
      },
    });

    await this.prisma.activityLog.create({
      data: {
        companyId,
        projectId: project.id,
        actorId: createdById,
        action: 'project.created',
        entityType: 'project',
        entityId: project.id,
        entityRef: project.name,
      },
    });

    return project;
  }

  async getProjects(companyId: string, userId: string) {
    const memberships = await this.prisma.projectMember.findMany({
      where: {
        userId,
        project: { companyId, isArchived: false },
      },
      include: {
        project: true,
      },
      orderBy: { joinedAt: 'desc' },
    });

    const projectIds = memberships.map((item) => item.projectId);
    const [testCaseCounts, memberCounts] = await Promise.all([
      this.prisma.testCase.groupBy({
        by: ['projectId'],
        where: { projectId: { in: projectIds } },
        _count: { _all: true },
      }),
      this.prisma.projectMember.groupBy({
        by: ['projectId'],
        where: { projectId: { in: projectIds } },
        _count: { _all: true },
      }),
    ]);

    const testCaseMap = new Map(testCaseCounts.map((x) => [x.projectId, x._count._all]));
    const memberMap = new Map(memberCounts.map((x) => [x.projectId, x._count._all]));

    return memberships.map((membership) => ({
      ...membership.project,
      stats: {
        testCases: testCaseMap.get(membership.projectId) ?? 0,
        members: memberMap.get(membership.projectId) ?? 0,
      },
      myProjectRole: membership.projectRole,
    }));
  }

  async getProject(projectId: string, companyId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, companyId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, displayName: true, email: true, role: true, isActive: true },
            },
          },
        },
      },
    });
    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const [testCases, testRuns] = await Promise.all([
      this.prisma.testCase.count({ where: { projectId } }),
      this.prisma.testRun.count({ where: { projectId } }),
    ]);

    return {
      ...project,
      stats: { testCases, testRuns, members: project.members.length },
    };
  }

  async updateProject(projectId: string, companyId: string, dto: UpdateProjectDto) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, companyId },
    });
    if (!project) {
      throw new NotFoundException('Project not found.');
    }
    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
      },
    });
  }

  async archiveProject(projectId: string, companyId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, companyId },
    });
    if (!project) {
      throw new NotFoundException('Project not found.');
    }
    return this.prisma.project.update({
      where: { id: projectId },
      data: { isArchived: true },
    });
  }

  async addProjectMember(projectId: string, companyId: string, userId: string) {
    const [project, user] = await Promise.all([
      this.prisma.project.findFirst({ where: { id: projectId, companyId } }),
      this.prisma.user.findFirst({ where: { id: userId, companyId, isActive: true } }),
    ]);

    if (!project) {
      throw new NotFoundException('Project not found.');
    }
    if (!user) {
      throw new NotFoundException('User not found in company.');
    }

    const exists = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
    });
    if (exists) {
      throw new BadRequestException('User is already a project member.');
    }

    return this.prisma.projectMember.create({
      data: {
        projectId,
        userId,
        projectRole: user.role,
      },
      include: {
        user: {
          select: { id: true, displayName: true, email: true, role: true },
        },
      },
    });
  }

  async removeProjectMember(projectId: string, companyId: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, companyId },
    });
    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const membership = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!membership) {
      throw new NotFoundException('Project membership not found.');
    }

    const membersCount = await this.prisma.projectMember.count({ where: { projectId } });
    if (membersCount <= 1) {
      throw new ForbiddenException('Cannot remove the last project member.');
    }

    await this.prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
    });
    return { message: 'Project member removed.' };
  }
}
