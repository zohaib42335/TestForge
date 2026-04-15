import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyCompany(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found.');
    }

    const [usersCount, projectsCount] = await Promise.all([
      this.prisma.user.count({
        where: { companyId, isActive: true },
      }),
      this.prisma.project.count({
        where: { companyId, isArchived: false },
      }),
    ]);

    return {
      ...company,
      usersCount,
      projectsCount,
    };
  }

  async updateCompany(companyId: string, dto: UpdateCompanyDto) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException('Company not found.');
    }

    return this.prisma.company.update({
      where: { id: companyId },
      data: { name: dto.name.trim() },
    });
  }

  async getUsage(companyId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException('Company not found.');
    }

    const [projectsUsed, usersUsed, testCasesUsed] = await Promise.all([
      this.prisma.project.count({
        where: { companyId, isArchived: false },
      }),
      this.prisma.user.count({
        where: { companyId, isActive: true },
      }),
      this.prisma.testCase.count({
        where: { companyId },
      }),
    ]);

    return {
      projects: { used: projectsUsed, max: company.maxProjects },
      users: { used: usersUsed, max: company.maxUsers },
      testCases: { used: testCasesUsed, max: company.maxTestCasesPerProject },
    };
  }
}
