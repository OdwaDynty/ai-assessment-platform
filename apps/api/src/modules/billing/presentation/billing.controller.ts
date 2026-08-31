// apps/api/src/modules/billing/presentation/billing.controller.ts
//
// Exposes billing endpoints. Two different trust models on the same
// controller: /subscribe and /subscription require normal user auth,
// but /itn is PUBLIC (PayFast calls it server-to-server with no user
// session) -- its authenticity is verified via PayFast's own signature
// scheme instead, never via SupabaseAuthGuard.

import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { BillingService } from '../application/billing.service';
import { verifyPayfastSignature } from '../application/payfast-signature.util';
import type { User } from '../../../../generated/prisma/client';

@Controller('billing')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly configService: ConfigService,
  ) {}

  // GET /billing/subscription — current user's plan/status.
  @Get('subscription')
  @UseGuards(SupabaseAuthGuard)
  getSubscription(@CurrentUser() user: User) {
    return this.billingService.getSubscriptionForUser(user.id);
  }

  // POST /billing/subscribe — builds a signed PayFast payload for the
  // frontend to auto-submit as a form POST to PayFast's checkout.
  @Post('subscribe')
  @UseGuards(SupabaseAuthGuard)
  subscribe(@CurrentUser() user: User) {
    return this.billingService.buildSubscriptionPayload(user.id, user.email);
  }

  // POST /billing/itn — PUBLIC webhook PayFast calls server-to-server
  // on payment events. NEVER guarded by SupabaseAuthGuard, since
  // PayFast has no user session to send. Authenticity is verified via
  // signature instead -- a request with a missing or invalid signature
  // is rejected outright and never reaches BillingService.processItn.
  @Post('itn')
  async handleItn(@Body() payload: Record<string, string>) {
    const passphrase = this.configService.get<string>('PAYFAST_PASSPHRASE');
    const receivedSignature = payload.signature;

    if (!receivedSignature) {
      throw new UnauthorizedException('Missing signature');
    }

    const isValid = verifyPayfastSignature(payload, receivedSignature, passphrase);
    if (!isValid) {
      throw new UnauthorizedException('Invalid signature');
    }

    await this.billingService.processItn(payload);
    return { received: true };
  }
}