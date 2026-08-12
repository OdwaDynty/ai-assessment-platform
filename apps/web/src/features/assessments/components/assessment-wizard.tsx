// apps/web/src/features/assessments/components/assessment-wizard.tsx
//
// Top-level controller for the 5-step Assessment Configuration wizard.
// Tracks the current step and the in-progress assessment's id (set once
// Step 1 successfully creates a draft). For now only Step 1 is wired up;
// Steps 2-5 will be added incrementally, same as the backend build.

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Step1SourceDocuments } from './steps/step1-source-documents';

const STEP_LABELS = [
  'Source Material',
  'Basics',
  'Question Types',
  'Rigor',
  'Review',
] as const;

export function AssessmentWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);

  function handleStep1Created(id: string) {
    setAssessmentId(id);
    setCurrentStep(2);
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>
          Step {currentStep}: {STEP_LABELS[currentStep - 1]}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {currentStep === 1 && (
          <Step1SourceDocuments onCreated={handleStep1Created} />
        )}
        {currentStep === 2 && (
          <p className="text-sm text-muted-foreground">
            Step 2 (Basics) coming next — assessment id: {assessmentId}
          </p>
        )}
      </CardContent>
    </Card>
  );
}