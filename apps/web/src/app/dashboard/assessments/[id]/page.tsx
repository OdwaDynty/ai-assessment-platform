// apps/web/src/app/dashboard/assessments/[id]/page.tsx
//
// Single assessment detail/review page. Reuses Step5Review directly --
// since it already fully displays the assessment's configuration,
// generation status, and generated questions, it works as a complete
// standalone detail view for both drafts and already-generated
// assessments, not just the final wizard step.

'use client';

import { use } from 'react';
import Link from 'next/link';
import { Step5Review } from '@/features/assessments/components/steps/step5-review';
import { Button } from '@/components/ui/button';

export default function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <main className="flex flex-col gap-6 p-8">
      <div className="w-full max-w-2xl flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-foreground">Assessment</h1>
        <Link href="/dashboard/assessments">
          <Button variant="outline">Back to assessments</Button>
        </Link>
      </div>
      <div className="w-full max-w-2xl border rounded-lg p-6">
        <Step5Review assessmentId={id} />
      </div>
    </main>
  );
}