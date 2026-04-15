import { Body, Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(UserRole.ADMIN, UserRole.QA_MANAGER)
  @Get()
  getCompanyUsers(@CurrentUser() user: { companyId: string }) {
    return this.usersService.getCompanyUsers(user.companyId);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/role')
  updateUserRole(
    @CurrentUser() user: { companyId: string; userId: string },
    @Param('id') targetUserId: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.usersService.updateUserRole(
      user.companyId,
      targetUserId,
      dto.role,
      user.userId,
    );
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  deactivateUser(
    @CurrentUser() user: { companyId: string; userId: string },
    @Param('id') targetUserId: string,
  ) {
    return this.usersService.deactivateUser(user.companyId, targetUserId, user.userId);
  }

  @Patch('me/profile')
  updateProfile(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.userId, dto);
  }
}
