import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Plan, SubscriptionStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignupDto } from './dto/signup.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { PLAN_LIMITS } from '../common/utils/plan-limits.util';

type JwtPayload = {
  sub: string;
  companyId: string;
  role: UserRole;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async signup(dto: SignupDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered.');
    }

    const companySlug = await this.generateUniqueCompanySlug(dto.companyName);
    const limits = PLAN_LIMITS.FREE;

    const company = await this.prisma.company.create({
      data: {
        name: dto.companyName.trim(),
        slug: companySlug,
        plan: Plan.FREE,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        maxProjects: limits.maxProjects,
        maxUsers: limits.maxUsers,
        maxTestCasesPerProject: limits.maxTestCasesPerProject,
      },
    });

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        companyId: company.id,
        email: dto.email.toLowerCase().trim(),
        passwordHash,
        displayName: dto.displayName.trim(),
        role: UserRole.ADMIN,
      },
    });

    const { rawToken, hashedToken, expiresAt } = this.createOpaqueToken(24 * 60 * 60 * 1000);
    await this.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: hashedToken,
        expiresAt,
      },
    });

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
    const verifyUrl = `${frontendUrl}/verify-email?token=${rawToken}`;
    await this.emailService.sendWelcomeEmail(
      user.email,
      user.displayName,
      company.name,
      verifyUrl,
    );

    const tokens = await this.generateTokens(user.id, company.id, user.role);

    return {
      ...tokens,
      user: this.toUserProfile(user),
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        plan: company.plan,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.companyId, user.role);
    return {
      ...tokens,
      user: this.toUserProfile(user),
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    return this.toUserProfile(user);
  }

  async generateTokens(userId: string, companyId: string, role: UserRole) {
    const payload: JwtPayload = {
      sub: userId,
      companyId,
      role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m') as unknown as number,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '30d') as unknown as number,
      }),
    ]);

    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);
    const refreshExpiryMs = 30 * 24 * 60 * 60 * 1000;

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(Date.now() + refreshExpiryMs),
      },
    });

    return { accessToken, refreshToken };
  }

  async refreshTokens(userId: string, dto: RefreshTokenDto) {
    const records = await this.prisma.refreshToken.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const matchingToken = await this.findMatchingTokenRecord(records, dto.refreshToken, now);
    if (!matchingToken) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    await this.prisma.refreshToken.delete({ where: { id: matchingToken.id } });

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const tokens = await this.generateTokens(user.id, user.companyId, user.role);
    return {
      ...tokens,
      user: this.toUserProfile(user),
    };
  }

  async getUserIdFromRefreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
      return payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid refresh token.');
    }
  }

  async logout(userId: string, dto: RefreshTokenDto) {
    const records = await this.prisma.refreshToken.findMany({
      where: { userId },
    });
    const matchingToken = await this.findMatchingTokenRecord(records, dto.refreshToken, new Date());
    if (!matchingToken) {
      return { message: 'Logged out.' };
    }

    await this.prisma.refreshToken.delete({ where: { id: matchingToken.id } });
    return { message: 'Logged out.' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user) {
      return { message: 'If this email exists, a password reset link has been sent.' };
    }

    const { rawToken, hashedToken, expiresAt } = this.createOpaqueToken(60 * 60 * 1000);
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashedToken,
        expiresAt,
      },
    });

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

    await this.emailService.sendPasswordResetEmail(user.email, user.displayName, resetUrl);
    return { message: 'If this email exists, a password reset link has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = this.hashToken(dto.token);
    const tokenRecord = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new NotFoundException('Reset token is invalid or expired.');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { passwordHash: newPasswordHash },
    });

    await this.prisma.refreshToken.deleteMany({ where: { userId: tokenRecord.userId } });
    await this.prisma.passwordResetToken.delete({ where: { id: tokenRecord.id } });

    return { message: 'Password reset successfully.' };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const tokenHash = this.hashToken(dto.token);
    const tokenRecord = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new NotFoundException('Verification token is invalid or expired.');
    }

    await this.prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { emailVerified: true },
    });

    await this.prisma.emailVerificationToken.delete({ where: { id: tokenRecord.id } });
    return { message: 'Email verified successfully.' };
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return this.toUserProfile(user);
  }

  async checkEmailAvailability(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true },
    });

    return { emailTaken: Boolean(user) };
  }

  private async findMatchingTokenRecord(
    records: { id: string; tokenHash: string; expiresAt: Date }[],
    incomingToken: string,
    now: Date,
  ) {
    for (const record of records) {
      if (record.expiresAt < now) {
        await this.prisma.refreshToken.delete({ where: { id: record.id } });
        continue;
      }

      const matches = await bcrypt.compare(incomingToken, record.tokenHash);
      if (matches) {
        return record;
      }
    }

    return null;
  }

  private createOpaqueToken(ttlMs: number) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + ttlMs);
    return { rawToken, hashedToken, expiresAt };
  }

  private hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async generateUniqueCompanySlug(name: string) {
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    let slug = baseSlug || `company-${crypto.randomBytes(3).toString('hex')}`;
    let counter = 1;

    while (true) {
      const existingCompany = await this.prisma.company.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (!existingCompany) {
        return slug;
      }

      slug = `${baseSlug}-${counter++}`;
    }
  }

  private toUserProfile(user: {
    id: string;
    email: string;
    displayName: string;
    role: UserRole;
    companyId: string;
    emailVerified: boolean;
    isActive: boolean;
  }) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      companyId: user.companyId,
      emailVerified: user.emailVerified,
      isActive: user.isActive,
    };
  }
}
