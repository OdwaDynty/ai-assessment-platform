// apps/api/src/modules/analytics/application/analytics.service.ts
//
// Aggregates the requesting user's own generation activity into a
// single summary payload: assessment counts, current-month usage vs
// their plan's limit, and question type/Bloom's/difficulty breakdowns
// across every question they've ever generated. All queries are scoped
// to userId -- no cross-user data is ever included.

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { BillingService, FREE_TIER_MONTHLY_LIMIT } from '../../billing/application/billing.service';

export interface AnalyticsSummary {
  totalAssessments: number;
  generatedAssessments: number;
  currentMonthGenerations: number;
  monthlyLimit: number | null; // null means unlimited (PRO plan)
  plan: 'FREE' | 'PRO';
  questionTypeBreakdown: Array<{ type: string; count: number }>;
  bloomsLevelBreakdown: Array<{ level: string; count: number }>;
  difficultyBreakdown: Array<{ level: string; count: number }>;
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billingService: BillingService,
  ) {}

  async getSummaryForUser(userId: string): Promise<AnalyticsSummary> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      totalAssessments,
      generatedAssessments,
      currentMonthGenerations,
      subscription,
      questionTypeCounts,
      bloomsLevelCounts,
      difficultyCounts,
    ] = await Promise.all([
      this.prisma.assessment.count({ where: { ownerId: userId } }),
      this.prisma.assessment.count({
        where: { ownerId: userId, status: 'GENERATED' },
      }),
      this.prisma.assessment.count({
        where: {
          ownerId: userId,
          status: { in: ['GENERATING', 'GENERATED', 'FAILED'] },
          createdAt: { gte: startOfMonth },
        },
      }),
      this.billingService.getSubscriptionForUser(userId),
      // Question type lives on AssessmentQuestionTypeConfig, not
      // Question itself, so we group by that relation's questionType,
      // scoped to this user's assessments via the nested filter.
      this.prisma.question.groupBy({
        by: ['questionTypeConfigId'],
        where: { assessment: { ownerId: userId } },
        _count: true,
      }),
      this.prisma.question.groupBy({
        by: ['bloomsLevel'],
        where: { assessment: { ownerId: userId } },
        _count: true,
      }),
      this.prisma.question.groupBy({
        by: ['difficulty'],
        where: { assessment: { ownerId: userId } },
        _count: true,
      }),
    ]);

    // questionTypeConfigId groupBy gives us config IDs, not the actual
    // QuestionType enum values -- resolve those IDs to their type via a
    // second query, then re-aggregate by the real type name.
    const configIds = questionTypeCounts.map((c) => c.questionTypeConfigId);
    const configs = await this.prisma.assessmentQuestionTypeConfig.findMany({
      where: { id: { in: configIds } },
      select: { id: true, questionType: true },
    });
    const configIdToType = new Map(configs.map((c) => [c.id, c.questionType]));

    const typeCountMap = new Map<string, number>();
    for (const row of questionTypeCounts) {
      const type = configIdToType.get(row.questionTypeConfigId);
      if (!type) continue;
      typeCountMap.set(type, (typeCountMap.get(type) ?? 0) + row._count);
    }

    return {
      totalAssessments,
      generatedAssessments,
      currentMonthGenerations,
      monthlyLimit: subscription.plan === 'PRO' ? null : FREE_TIER_MONTHLY_LIMIT,
      plan: subscription.plan,
      questionTypeBreakdown: Array.from(typeCountMap.entries()).map(([type, count]) => ({
        type,
        count,
      })),
      bloomsLevelBreakdown: bloomsLevelCounts.map((row) => ({
        level: row.bloomsLevel,
        count: row._count,
      })),
      difficultyBreakdown: difficultyCounts.map((row) => ({
        level: row.difficulty,
        count: row._count,
      })),
    };
  }
}