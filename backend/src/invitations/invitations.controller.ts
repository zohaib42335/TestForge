import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { InvitationsService } from './invitations.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  inviteUser(
    @CurrentUser() user: { companyId: string; userId: string },
    @Body() dto: InviteUserDto,
  ) {
    return this.invitationsService.inviteUser(user.companyId, user.userId, dto);
  }

  @Roles(UserRole.ADMIN)
  @Get()
  getPendingInvitations(@CurrentUser() user: { companyId: string }) {
    return this.invitationsService.getPendingInvitations(user.companyId);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  cancelInvitation(
    @CurrentUser() user: { companyId: string },
    @Param('id') invitationId: string,
  ) {
    return this.invitationsService.cancelInvitation(user.companyId, invitationId);
  }

  @Roles(UserRole.ADMIN)
  @Post(':id/resend')
  resendInvitation(
    @CurrentUser() user: { companyId: string },
    @Param('id') invitationId: string,
  ) {
    return this.invitationsService.resendInvitation(user.companyId, invitationId);
  }

  @Public()
  @Post('accept')
  acceptInvitation(@Body() dto: AcceptInvitationDto) {
    return this.invitationsService.acceptInvitation(dto.token, dto);
  }
}
