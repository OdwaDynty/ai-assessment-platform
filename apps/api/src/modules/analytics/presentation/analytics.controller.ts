// apps/api/src/modules/analytics/presentation/analytics.controller.ts

import { Controller, Get, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AnalyticsService } from '../application/analytics.service';
import type { User } from '../../../../generated/prisma/client';

@Controller('analytics')
@UseGuards(SupabaseAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  getSummary(@CurrentUser() user: User) {
    return this.analyticsService.getSummaryForUser(user.id);
  }
}
