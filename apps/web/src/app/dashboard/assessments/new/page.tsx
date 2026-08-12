// apps/web/src/app/dashboard/assessments/new/page.tsx
//
// Hosts the Assessment Configuration wizard. Mirrors the layout pattern
// in dashboard/documents/page.tsx (centered Card, Back button to dashboard).

'use client';

import Link from 'next/link';
import { AssessmentWizard } from '@/features/assessments/components/assessment-wizard';
import { Button } from '@/components/ui/button';

export default function NewAssessmentPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="w-full max-w-2xl flex justify-between items-center">
        <h1 className="text-xl font-semibold">New Assessment</h1>
        <Link href="/dashboard">
          <Button variant="outline">Back</Button>
        </Link>
      </div>
      <AssessmentWizard />
    </main>
  );
}