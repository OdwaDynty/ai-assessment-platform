// apps/web/src/features/assessments/components/steps/step5-review.tsx
//
// Step 5 of the Assessment Configuration wizard: final review screen.
// Pulls the complete assessment via useAssessment and displays every
// configured section (basics, source documents, learning outcomes,
// question types, rigor) for the educator to confirm before generation.
// Phase 8 (actual AI generation) doesn't exist yet, so the final action
// here just marks the wizard as complete and returns to the dashboard.

'use client';

import Link from 'next/link';
import { useAssessment } from '../../api/use-assessment';
import {
  QUESTION_TYPE_LABELS,
  type QUESTION_TYPES,
} from '../../schemas/assessment.schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface Step5ReviewProps {
  assessmentId: string;
}

export function Step5Review({ assessmentId }: Step5ReviewProps) {
  const { data: assessment, isLoading, isError } = useAssessment(assessmentId);

  if (isLoading) {
    return <p className="text-muted-foreground">Loading assessment...</p>;
  }
  if (isError || !assessment) {
    return <p className="text-red-600">Failed to load assessment for review.</p>;
  }

  const configuredMarks = assessment.questionTypeConfigs.reduce(
    (sum, qt) => sum + qt.questionCount * qt.marksPerQuestion,
    0,
  );
  const marksMismatch = configuredMarks !== assessment.totalMarks;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Review & confirm</h3>
        <p className="text-sm text-muted-foreground">
          Check everything below before finalizing this assessment configuration.
        </p>
      </div>

      <section className="space-y-1">
        <h4 className="text-sm font-semibold text-muted-foreground">Basics</h4>
        <p className="text-sm">
          <span className="font-medium">{assessment.title}</span> —{' '}
          {assessment.moduleName}
        </p>
        <p className="text-sm text-muted-foreground">
          {assessment.nqfLevel?.replace('_', ' ')} · {assessment.assessmentType} ·{' '}
          {assessment.totalDurationMinutes} min · {assessment.totalMarks} marks
        </p>
      </section>

      <Separator />

      <section className="space-y-1">
        <h4 className="text-sm font-semibold text-muted-foreground">
          Source documents ({assessment.sourceDocuments.length})
        </h4>
        {assessment.sourceDocuments.map((link) => (
          <p key={link.id} className="text-sm">
            {link.document.fileName}
          </p>
        ))}
      </section>

      <Separator />

      <section className="space-y-1">
        <h4 className="text-sm font-semibold text-muted-foreground">
          Learning outcomes ({assessment.learningOutcomes.length})
        </h4>
        {assessment.learningOutcomes.map((lo) => (
          <p key={lo.id} className="text-sm">
            <span className="font-medium">{lo.code}:</span> {lo.description}
          </p>
        ))}
      </section>

      <Separator />

      <section className="space-y-1">
        <h4 className="text-sm font-semibold text-muted-foreground">
          Question types
        </h4>
        {assessment.questionTypeConfigs.map((qt) => (
          <p key={qt.id} className="text-sm">
            {QUESTION_TYPE_LABELS[qt.questionType as (typeof QUESTION_TYPES)[number]]}
            : {qt.questionCount} × {qt.marksPerQuestion} marks ={' '}
            {qt.questionCount * qt.marksPerQuestion} marks
          </p>
        ))}
        <p className={`text-sm ${marksMismatch ? 'text-amber-600' : 'text-muted-foreground'}`}>
          Total configured: {configuredMarks} / {assessment.totalMarks} marks
          {marksMismatch && ' (does not match total marks)'}
        </p>
      </section>

      <Separator />

      <section className="space-y-2">
        <h4 className="text-sm font-semibold text-muted-foreground">
          Academic rigor
        </h4>
        {assessment.bloomsDistribution && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Bloom's Taxonomy
            </p>
            <p className="text-sm">
              {Object.entries(assessment.bloomsDistribution)
                .map(([level, pct]) => `${level}: ${pct}%`)
                .join(' · ')}
            </p>
          </div>
        )}
        {assessment.difficultyDistribution && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Difficulty
            </p>
            <p className="text-sm">
              {Object.entries(assessment.difficultyDistribution)
                .map(([level, pct]) => `${level}: ${pct}%`)
                .join(' · ')}
            </p>
          </div>
        )}
      </section>

      <Separator />

      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            This assessment is fully configured and ready for AI generation.
            Generation isn't available yet — check back once Phase 8 ships.
          </p>
        </CardContent>
      </Card>

      <Link href="/dashboard">
        <Button>Done — back to dashboard</Button>
      </Link>
    </div>
  );
}