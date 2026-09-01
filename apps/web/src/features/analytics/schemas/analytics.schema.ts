export interface AnalyticsSummary {
  totalAssessments: number;
  generatedAssessments: number;
  currentMonthGenerations: number;
  monthlyLimit: number | null;
  plan: 'FREE' | 'PRO';
  questionTypeBreakdown: Array<{ type: string; count: number }>;
  bloomsLevelBreakdown: Array<{ level: string; count: number }>;
  difficultyBreakdown: Array<{ level: string; count: number }>;
}