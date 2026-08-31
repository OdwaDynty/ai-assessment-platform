// apps/web/src/app/dashboard/assessments/page.tsx
//
// "My Assessments" list page. A Card with a "New Assessment" action and
// a table of existing assessments, each linking through to its
// detail/review page.

'use client';

import Link from 'next/link';
import { useAssessmentsList } from '@/features/assessments/api/use-assessments-list';
import { AssessmentsTable } from '@/features/assessments/components/assessments-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AssessmentsPage() {
  const { data, isLoading, isError } = useAssessmentsList();

  return (
    <main className="flex flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground mb-1">My Assessments</h1>
        <p className="text-sm text-muted-foreground">
          View and manage your AI-generated assessments.
        </p>
      </div>
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All assessments</CardTitle>
          <Link href="/dashboard/assessments/new">
            <Button>New Assessment</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-muted-foreground">Loading assessments...</p>}
          {isError && <p className="text-red-600">Failed to load assessments.</p>}
          {data && <AssessmentsTable assessments={data} />}
        </CardContent>
      </Card>
    </main>
  );
}