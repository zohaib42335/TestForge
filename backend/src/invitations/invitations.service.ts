import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InvitationStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { InviteUserDto } from './dto/invite-user.dto';

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly authService: AuthService,
  ) {}

  async inviteUser(companyId: string, invitedById: string, dto: InviteUserDto) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException('Company not found.');
    }

    const usersCount = await this.prisma.user.count({
      where: { companyId, isActive: true },
    });
    if (usersCount >= company.maxUsers) {
      throw new BadRequestException('User limit reached for current plan.');
    }

    const normalizedEmail = dto.email.toLowerCase().trim();
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser && existingUser.companyId === companyId) {
      throw new ConflictException('User is already a company member.');
    }

    const pending = await this.prisma.invitation.findFirst({
      where: {
        companyId,
        email: normalizedEmail,
        status: InvitationStatus.PENDING,
      },
    });
    if (pending) {
      throw new ConflictException('A pending invitation already exists for this email.');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const invitation = await this.prisma.invitation.create({
      data: {
        companyId,
        invitedById,
        email: normalizedEmail,
        role: dto.role,
        token,
        status: InvitationStatus.PENDING,
        expiresAt,
      },
      include: {
        invitedBy: true,
        company: true,
      },
    });

    const inviteUrl = `${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/accept-invite?token=${token}`;
    try {
      await this.emailService.sendInvitationEmail(
        normalizedEmail,
        invitation.invitedBy.displayName,
        invitation.company.name,
        invitation.role,
        inviteUrl,
      );
    } catch (error) {
      await this.prisma.invitation.delete({ where: { id: invitation.id } });
      throw new ServiceUnavailableException(
        'Invitation email could not be sent. Please verify email configuration and try again.',
      );
    }

    return invitation;
  }

  async acceptInvitation(token: string, dto: AcceptInvitationDto) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: { company: true },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found.');
    }
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Invitation is no longer pending.');
    }
    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invitation has expired.');
    }

    let user = await this.prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (user) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          companyId: invitation.companyId,
          role: invitation.role,
          isActive: true,
        },
      });
    } else {
      if (!dto.password || !dto.displayName) {
        throw new BadRequestException('Display name and password are required for new users.');
      }
      const passwordHash = await bcrypt.hash(dto.password, 12);
      user = await this.prisma.user.create({
        data: {
          companyId: invitation.companyId,
          email: invitation.email,
          displayName: dto.displayName,
          passwordHash,
          role: invitation.role,
          emailVerified: true,
        },
      });
    }

    await this.prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.ACCEPTED },
    });

    if (invitation.role === UserRole.QA_MANAGER) {
      const companyProjects = await this.prisma.project.findMany({
        where: {
          companyId: invitation.companyId,
          isArchived: false,
        },
        select: { id: true },
      });

      if (companyProjects.length > 0) {
        await this.prisma.projectMember.createMany({
          data: companyProjects.map((project) => ({
            projectId: project.id,
            userId: user.id,
            projectRole: user.role,
          })),
          skipDuplicates: true,
        });
      }
    }

    const tokens = await this.authService.generateTokens(user.id, user.companyId, user.role);
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        companyId: user.companyId,
      },
      company: {
        id: invitation.company.id,
        name: invitation.company.name,
      },
    };
  }

  async getPendingInvitations(companyId: string) {
    return this.prisma.invitation.findMany({
      where: {
        companyId,
        status: InvitationStatus.PENDING,
      },
      include: {
        invitedBy: {
          select: { id: true, displayName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelInvitation(companyId: string, invitationId: string) {
    const invitation = await this.prisma.invitation.findFirst({
      where: { id: invitationId, companyId },
    });
    if (!invitation) {
      throw new NotFoundException('Invitation not found.');
    }
    await this.prisma.invitation.delete({ where: { id: invitationId } });
    return { message: 'Invitation cancelled.' };
  }

  async resendInvitation(companyId: string, invitationId: string) {
    const invitation = await this.prisma.invitation.findFirst({
      where: {
        id: invitationId,
        companyId,
        status: InvitationStatus.PENDING,
      },
      include: {
        invitedBy: true,
        company: true,
      },
    });
    if (!invitation) {
      throw new NotFoundException('Pending invitation not found.');
    }

    const updated = await this.prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
      include: {
        invitedBy: true,
        company: true,
      },
    });

    const inviteUrl = `${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/accept-invite?token=${updated.token}`;
    try {
      await this.emailService.sendInvitationEmail(
        updated.email,
        updated.invitedBy.displayName,
        updated.company.name,
        updated.role,
        inviteUrl,
      );
    } catch (error) {
      throw new ServiceUnavailableException(
        'Invitation email could not be resent. Please verify email configuration and try again.',
      );
    }

    return updated;
  }
}
