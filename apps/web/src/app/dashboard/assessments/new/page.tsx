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
    <main className="flex min-h-screen flex-col items-center gap-6 p-8 pt-16">
      <div className="w-full max-w-2xl flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-1">New Assessment</h1>
          <p className="text-sm text-muted-foreground">
            Configure a new AI-generated assessment step by step.
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">Back</Button>
        </Link>
      </div>
      <AssessmentWizard />
    </main>
  );
}