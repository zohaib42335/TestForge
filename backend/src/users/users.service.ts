import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InvitationStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getCompanyUsers(companyId: string) {
    return this.prisma.user.findMany({
      where: { companyId, isActive: true },
      select: {
        id: true,
        displayName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async updateUserRole(
    companyId: string,
    targetUserId: string,
    newRole: UserRole,
    requestingUserId: string,
  ) {
    if (targetUserId === requestingUserId) {
      throw new BadRequestException('You cannot change your own role.');
    }

    const targetUser = await this.prisma.user.findFirst({
      where: { id: targetUserId, companyId },
    });
    if (!targetUser) {
      throw new NotFoundException('User not found.');
    }

    if (targetUser.role === UserRole.ADMIN && newRole !== UserRole.ADMIN) {
      const adminCount = await this.prisma.user.count({
        where: { companyId, role: UserRole.ADMIN, isActive: true },
      });
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot demote the last Admin.');
      }
    }

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
      select: {
        id: true,
        displayName: true,
        email: true,
        role: true,
        isActive: true,
      },
    });
  }

  async deactivateUser(companyId: string, targetUserId: string, requestingUserId: string) {
    if (targetUserId === requestingUserId) {
      throw new BadRequestException('You cannot deactivate your own account.');
    }

    const targetUser = await this.prisma.user.findFirst({
      where: { id: targetUserId, companyId },
    });
    if (!targetUser) {
      throw new NotFoundException('User not found.');
    }

    const [updatedUser] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: targetUserId },
        data: { isActive: false },
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
          isActive: true,
        },
      }),
      this.prisma.invitation.updateMany({
        where: {
          companyId,
          email: targetUser.email.toLowerCase(),
          status: InvitationStatus.PENDING,
        },
        data: {
          status: InvitationStatus.CANCELLED,
        },
      }),
    ]);

    return updatedUser;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { displayName: dto.displayName.trim() },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        companyId: true,
      },
    });
  }
}
