import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Company, Plan, SubscriptionStatus } from '@prisma/client';
import Stripe from 'stripe';
import { PLAN_LIMITS } from '../common/utils/plan-limits.util';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BillingService {
  private readonly stripe: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const stripeSecret = this.configService.get<string>('STRIPE_SECRET_KEY', '');
    this.stripe = new Stripe(stripeSecret, { apiVersion: '2026-03-25.dahlia' });
  }

  async getOrCreateStripeCustomer(company: Company, adminEmail: string) {
    if (company.stripeCustomerId) {
      return this.stripe.customers.retrieve(company.stripeCustomerId);
    }

    const customer = await this.stripe.customers.create({
      email: adminEmail,
      name: company.name,
      metadata: {
        companyId: company.id,
      },
    });

    await this.prisma.company.update({
      where: { id: company.id },
      data: { stripeCustomerId: customer.id },
    });

    return customer;
  }

  async createCheckoutSession(companyId: string, plan: Plan, adminEmail: string) {
    if (plan !== Plan.STARTER && plan !== Plan.PROFESSIONAL) {
      throw new BadRequestException('Only STARTER and PROFESSIONAL can be purchased.');
    }

    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException('Company not found.');
    }

    const customer = await this.getOrCreateStripeCustomer(company, adminEmail);
    const customerId =
      typeof customer === 'object' && 'id' in customer
        ? customer.id
        : company.stripeCustomerId;

    const starterPriceId = this.configService.get<string>('STRIPE_STARTER_PRICE_ID', '');
    const professionalPriceId = this.configService.get<string>(
      'STRIPE_PROFESSIONAL_PRICE_ID',
      '',
    );
    const selectedPriceId = plan === Plan.STARTER ? starterPriceId : professionalPriceId;
    if (!selectedPriceId) {
      throw new BadRequestException('Stripe price ID is not configured.');
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId || undefined,
      line_items: [{ price: selectedPriceId, quantity: 1 }],
      success_url: `${frontendUrl}/billing/success`,
      cancel_url: `${frontendUrl}/billing`,
      metadata: { companyId },
    });

    return { url: session.url };
  }

  async createPortalSession(companyId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException('Company not found.');
    }
    if (!company.stripeCustomerId) {
      throw new BadRequestException('No Stripe customer linked to this company.');
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
    const session = await this.stripe.billingPortal.sessions.create({
      customer: company.stripeCustomerId,
      return_url: `${frontendUrl}/billing`,
    });

    return { url: session.url };
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET', '');
    let event: any;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch {
      throw new BadRequestException('Invalid webhook signature.');
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const companyId = session.metadata?.companyId;
        if (!companyId) break;

        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id || null;

        let priceId = session.metadata?.priceId || null;
        if (!priceId && subscriptionId) {
          const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
          priceId = subscription.items.data[0]?.price?.id || null;
        }

        await this.prisma.company.update({
          where: { id: companyId },
          data: {
            stripeSubscriptionId: subscriptionId,
            stripePriceId: priceId,
            subscriptionStatus: SubscriptionStatus.ACTIVE,
          },
        });

        if (priceId) {
          const plan = this.getPlanFromPriceId(priceId);
          await this.updateCompanyPlanLimits(companyId, plan);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const subscriptionId =
          typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription?.id || null;

        if (subscriptionId) {
          await this.prisma.company.updateMany({
            where: { stripeSubscriptionId: subscriptionId },
            data: { subscriptionStatus: SubscriptionStatus.ACTIVE },
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const subscriptionId =
          typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription?.id || null;

        if (subscriptionId) {
          await this.prisma.company.updateMany({
            where: { stripeSubscriptionId: subscriptionId },
            data: { subscriptionStatus: SubscriptionStatus.PAST_DUE },
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const priceId = subscription.items.data[0]?.price?.id;
        const company = await this.prisma.company.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });
        if (!company || !priceId) break;

        const plan = this.getPlanFromPriceId(priceId);
        await this.prisma.company.update({
          where: { id: company.id },
          data: {
            stripePriceId: priceId,
            plan,
            subscriptionStatus: SubscriptionStatus.ACTIVE,
          },
        });
        await this.updateCompanyPlanLimits(company.id, plan);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const company = await this.prisma.company.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });
        if (!company) break;

        await this.prisma.company.update({
          where: { id: company.id },
          data: {
            plan: Plan.FREE,
            subscriptionStatus: SubscriptionStatus.CANCELLED,
            stripeSubscriptionId: null,
            stripePriceId: null,
          },
        });
        await this.updateCompanyPlanLimits(company.id, Plan.FREE);
        break;
      }
      default:
        break;
    }

    return { received: true };
  }

  getPlanFromPriceId(priceId: string): Plan {
    const starterPriceId = this.configService.get<string>('STRIPE_STARTER_PRICE_ID', '');
    const professionalPriceId = this.configService.get<string>(
      'STRIPE_PROFESSIONAL_PRICE_ID',
      '',
    );

    if (priceId === starterPriceId) return Plan.STARTER;
    if (priceId === professionalPriceId) return Plan.PROFESSIONAL;
    return Plan.FREE;
  }

  async updateCompanyPlanLimits(companyId: string, plan: Plan) {
    const limits = PLAN_LIMITS[plan];
    await this.prisma.company.update({
      where: { id: companyId },
      data: {
        plan,
        maxProjects: limits.maxProjects,
        maxUsers: limits.maxUsers,
        maxTestCasesPerProject: limits.maxTestCasesPerProject,
      },
    });
  }

  async getSubscription(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        _count: {
          select: {
            projects: { where: { isArchived: false } },
            users: { where: { isActive: true } },
          },
        },
      },
    });
    if (!company) {
      throw new NotFoundException('Company not found.');
    }

    const testCasesUsed = await this.prisma.testCase.count({
      where: {
        companyId,
        project: { isArchived: false },
      },
    });

    return {
      plan: company.plan,
      subscriptionStatus: company.subscriptionStatus,
      stripePriceId: company.stripePriceId,
      limits: {
        projects: company.maxProjects,
        users: company.maxUsers,
        testCases: company.maxTestCasesPerProject,
      },
      usage: {
        projects: company._count.projects,
        users: company._count.users,
        testCases: testCasesUsed,
      },
      nextBillingDate: company.subscriptionEndsAt,
    };
  }
}
