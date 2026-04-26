import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AppService } from './app.service';
import { Roles } from './auth/decorators/roles.decorator';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { EmailService } from './email/email.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly emailService: EmailService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Roles(UserRole.ADMIN)
  @Get('health/email')
  getEmailHealth() {
    return this.emailService.getConfigHealth();
  }
}
