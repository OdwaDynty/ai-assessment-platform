// apps/web/src/app/dashboard/assessments/new/page.tsx
//
// Hosts the Assessment Configuration wizard.

'use client';

import { AssessmentWizard } from '@/features/assessments/components/assessment-wizard';

export default function NewAssessmentPage() {
  return (
    <main className="flex flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground mb-1">New Assessment</h1>
        <p className="text-sm text-muted-foreground">
          Configure a new AI-generated assessment step by step.
        </p>
      </div>
      <AssessmentWizard />
    </main>
  );
}