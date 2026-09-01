'use client';

import { useAnalyticsSummary } from '@/features/analytics/api/use-analytics-summary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function AnalyticsPage() {
  const { data, isLoading, isError } = useAnalyticsSummary();

  return (
    <main className="flex flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground mb-1">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Your assessment generation activity at a glance.
        </p>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading analytics...</p>}
      {isError && <p className="text-red-600">Failed to load analytics.</p>}

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Assessments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{data.totalAssessments}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.generatedAssessments} successfully generated
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">
                  {data.currentMonthGenerations}
                  {data.monthlyLimit !== null && (
                    <span className="text-lg text-muted-foreground"> / {data.monthlyLimit}</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.monthlyLimit === null ? 'Unlimited generations' : 'Generations used'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Current Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={data.plan === 'PRO' ? 'success' : 'outline'}>
                  {data.plan}
                </Badge>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-5xl">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Question Types</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                {data.questionTypeBreakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No questions generated yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.questionTypeBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="var(--color-primary)" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Bloom&apos;s Taxonomy</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                {data.bloomsLevelBreakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No questions generated yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.bloomsLevelBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="level" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="var(--color-primary)" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Difficulty</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                {data.difficultyBreakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No questions generated yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.difficultyBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="level" tick={{ fontSize: 10 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="var(--color-primary)" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </main>
  );
}