import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Plan, UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BillingService } from './billing.service';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createCheckout(
    @CurrentUser() user: { companyId: string; email: string },
    @Body() body: { plan: Plan },
  ) {
    return this.billingService.createCheckoutSession(user.companyId, body.plan, user.email);
  }

  @Post('portal')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async createPortal(@CurrentUser() user: { companyId: string }) {
    return this.billingService.createPortalSession(user.companyId);
  }

  @Post('webhook')
  @Public()
  async webhook(
    @Req() req: { rawBody?: Buffer; body: Buffer },
    @Headers('stripe-signature') signature: string,
  ) {
    return this.billingService.handleWebhook(req.rawBody || req.body, signature);
  }

  @Get('subscription')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getSubscription(@CurrentUser() user: { companyId: string }) {
    return this.billingService.getSubscription(user.companyId);
  }
}
