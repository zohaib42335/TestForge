import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectMemberDto } from './dto/project-member.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Roles(UserRole.ADMIN, UserRole.QA_MANAGER)
  @Post()
  createProject(
    @CurrentUser() user: { companyId: string; userId: string },
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.createProject(user.companyId, user.userId, dto);
  }

  @Get()
  getProjects(@CurrentUser() user: { companyId: string; userId: string }) {
    return this.projectsService.getProjects(user.companyId, user.userId);
  }

  @Get(':id')
  getProject(
    @CurrentUser() user: { companyId: string },
    @Param('id') projectId: string,
  ) {
    return this.projectsService.getProject(projectId, user.companyId);
  }

  @Roles(UserRole.ADMIN, UserRole.QA_MANAGER)
  @Patch(':id')
  updateProject(
    @CurrentUser() user: { companyId: string },
    @Param('id') projectId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.updateProject(projectId, user.companyId, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id/archive')
  archiveProject(
    @CurrentUser() user: { companyId: string },
    @Param('id') projectId: string,
  ) {
    return this.projectsService.archiveProject(projectId, user.companyId);
  }

  @Roles(UserRole.ADMIN, UserRole.QA_MANAGER)
  @Post(':id/members')
  addMember(
    @CurrentUser() user: { companyId: string },
    @Param('id') projectId: string,
    @Body() dto: ProjectMemberDto,
  ) {
    return this.projectsService.addProjectMember(projectId, user.companyId, dto.userId);
  }

  @Roles(UserRole.ADMIN, UserRole.QA_MANAGER)
  @Delete(':id/members/:userId')
  removeMember(
    @CurrentUser() user: { companyId: string },
    @Param('id') projectId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.projectsService.removeProjectMember(projectId, user.companyId, targetUserId);
  }
}
