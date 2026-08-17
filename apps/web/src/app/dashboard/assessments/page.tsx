// apps/web/src/app/dashboard/assessments/page.tsx
//
// "My Assessments" list page. Mirrors dashboard/documents/page.tsx's
// layout: a Card with a "New Assessment" action and a table of existing
// assessments, each linking through to its detail/review page.

'use client';

import Link from 'next/link';
import { useAssessmentsList } from '@/features/assessments/api/use-assessments-list';
import { AssessmentsTable } from '@/features/assessments/components/assessments-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AssessmentsPage() {
  const { data, isLoading, isError } = useAssessmentsList();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>My Assessments</CardTitle>
          <div className="flex gap-2">
            <Link href="/dashboard/assessments/new">
              <Button>New Assessment</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">Back</Button>
            </Link>
          </div>
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