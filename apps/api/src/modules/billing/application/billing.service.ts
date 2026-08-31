// apps/api/src/modules/billing/application/billing.service.ts
//
// Handles subscription status lookups, building signed PayFast payment
// payloads, and processing verified ITN webhook notifications.

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { generatePayfastSignature } from './payfast-signature.util';
import type { Subscription } from '../../../../generated/prisma/client';

// The FREE tier's monthly generation limit. PRO is unlimited.
export const FREE_TIER_MONTHLY_LIMIT = 3;

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Returns the user's current subscription, or a synthetic FREE/ACTIVE
   * default if they've never subscribed (no Subscription row exists
   * yet) -- every user implicitly has FREE access without needing a
   * row created upfront.
   */
  async getSubscriptionForUser(userId: string): Promise<Pick<Subscription, 'plan' | 'status' | 'currentPeriodEnd'>> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      select: { plan: true, status: true, currentPeriodEnd: true },
    });

    return subscription ?? { plan: 'FREE', status: 'ACTIVE', currentPeriodEnd: null };
  }

  /**
   * Checks whether a user is allowed to start a new assessment
   * generation, based on their plan. PRO is always allowed. FREE is
   * allowed only if they've generated fewer than FREE_TIER_MONTHLY_LIMIT
   * assessments so far this calendar month.
   *
   * Counts Assessment rows with status GENERATING/GENERATED/FAILED
   * (i.e. generation was actually attempted) created since the start
   * of the current calendar month, reusing existing data rather than a
   * separate usage-tracking table.
   */
  async canGenerateAssessment(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    const subscription = await this.getSubscriptionForUser(userId);

    if (subscription.plan === 'PRO' && subscription.status === 'ACTIVE') {
      return { allowed: true };
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const generationsThisMonth = await this.prisma.assessment.count({
      where: {
        ownerId: userId,
        status: { in: ['GENERATING', 'GENERATED', 'FAILED'] },
        createdAt: { gte: startOfMonth },
      },
    });

    if (generationsThisMonth >= FREE_TIER_MONTHLY_LIMIT) {
      return {
        allowed: false,
        reason: `You've reached your free plan's limit of ${FREE_TIER_MONTHLY_LIMIT} assessment generations this month. Upgrade to Pro for unlimited generation.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Builds a signed PayFast payment payload for a user to subscribe to
   * the PRO plan. The frontend auto-submits this as a form POST to
   * PayFast's hosted checkout -- we never handle card details directly.
   */
  buildSubscriptionPayload(userId: string, userEmail: string) {
    const merchantId = this.configService.get<string>('PAYFAST_MERCHANT_ID');
    const merchantKey = this.configService.get<string>('PAYFAST_MERCHANT_KEY');
    const passphrase = this.configService.get<string>('PAYFAST_PASSPHRASE');
    const isSandbox = this.configService.get<string>('PAYFAST_SANDBOX') === 'true';  
    const apiUrl = this.configService.get<string>('API_URL') ?? 'http://localhost:3001';
    const webUrl = this.configService.get<string>('WEB_URL') ?? 'http://localhost:3000';

    const data: Record<string, string> = {
      merchant_id: merchantId!,
      merchant_key: merchantKey!,
      return_url: `${webUrl}/dashboard/billing?status=success`,
      cancel_url: `${webUrl}/dashboard/billing?status=cancelled`,
      notify_url: `${apiUrl}/billing/itn`,
      email_address: userEmail,
      m_payment_id: userId, // used to match the ITN back to this user
      amount: '249.00',
      item_name: 'AI Assessment Platform - Pro Subscription',
      subscription_type: '1', // 1 = subscription, per PayFast's spec
      billing_date: new Date().toISOString().slice(0, 10),
      recurring_amount: '249.00',
      frequency: '3', // 3 = monthly, per PayFast's spec
      cycles: '0', // 0 = indefinite, until cancelled
    };

    const signature = generatePayfastSignature(data, passphrase);

    return {
      ...data,
      signature,
      actionUrl: isSandbox
        ? 'https://sandbox.payfast.co.za/eng/process'
        : 'https://www.payfast.co.za/eng/process',
    };
  }

  /**
   * Processes a verified ITN webhook notification. Called only after
   * the controller has confirmed the signature is valid -- this method
   * trusts its input completely, so signature verification must never
   * be skipped upstream.
   */
  async processItn(payload: Record<string, string>): Promise<void> {
    const userId = payload.m_payment_id;
    const paymentStatus = payload.payment_status; // 'COMPLETE', 'CANCELLED', etc.

    if (!userId) {
      this.logger.warn('Received ITN with no m_payment_id, ignoring');
      return;
    }

    if (paymentStatus === 'COMPLETE') {
      const currentPeriodEnd = new Date();
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

      await this.prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          plan: 'PRO',
          status: 'ACTIVE',
          payfastToken: payload.token,
          payfastSubscriptionId: payload.pf_payment_id,
          currentPeriodEnd,
        },
        update: {
          plan: 'PRO',
          status: 'ACTIVE',
          payfastToken: payload.token,
          payfastSubscriptionId: payload.pf_payment_id,
          currentPeriodEnd,
        },
      });
      this.logger.log(`Subscription activated for user ${userId}`);
    } else if (paymentStatus === 'CANCELLED') {
      await this.prisma.subscription.updateMany({
        where: { userId },
        data: { status: 'CANCELLED' },
      });
      this.logger.log(`Subscription cancelled for user ${userId}`);
    } else {
      this.logger.warn(`Unhandled ITN payment_status: ${paymentStatus} for user ${userId}`);
    }
  }
}