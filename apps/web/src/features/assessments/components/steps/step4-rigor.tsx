// apps/web/src/features/assessments/components/steps/step4-rigor.tsx
//
// Step 4 of the Assessment Configuration wizard: Bloom's Taxonomy and
// difficulty distribution. Both must sum to exactly 100 (hard backend
// validation) -- this component tracks running totals live and disables
// submit until both are correct, so the educator gets immediate feedback
// rather than a round-trip error.

'use client';

import { useState } from 'react';
import { useUpdateRigor } from '../../api/use-update-rigor';
import { BLOOMS_LEVELS, DIFFICULTY_LEVELS } from '../../schemas/assessment.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/field';

interface Step4RigorProps {
  assessmentId: string;
  onCompleted: () => void;
}

type BloomsState = Record<(typeof BLOOMS_LEVELS)[number], string>;
type DifficultyState = Record<(typeof DIFFICULTY_LEVELS)[number], string>;

const BLOOMS_LABELS: Record<(typeof BLOOMS_LEVELS)[number], string> = {
  REMEMBER: 'Remember',
  UNDERSTAND: 'Understand',
  APPLY: 'Apply',
  ANALYZE: 'Analyze',
  EVALUATE: 'Evaluate',
  CREATE: 'Create',
};

const DIFFICULTY_LABELS: Record<(typeof DIFFICULTY_LEVELS)[number], string> = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
};

function sumValues(state: Record<string, string>): number {
  return Object.values(state).reduce((sum, v) => sum + (Number(v) || 0), 0);
}

export function Step4Rigor({ assessmentId, onCompleted }: Step4RigorProps) {
  const [blooms, setBlooms] = useState<BloomsState>(
    Object.fromEntries(BLOOMS_LEVELS.map((l) => [l, '0'])) as BloomsState,
  );
  const [difficulty, setDifficulty] = useState<DifficultyState>(
    Object.fromEntries(DIFFICULTY_LEVELS.map((l) => [l, '0'])) as DifficultyState,
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const { mutate, isPending, error } = useUpdateRigor();

  const bloomsTotal = sumValues(blooms);
  const difficultyTotal = sumValues(difficulty);
  const bothValid = bloomsTotal === 100 && difficultyTotal === 100;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);

    if (!bothValid) {
      setValidationError(
        "Both Bloom's Taxonomy and Difficulty distributions must each sum to exactly 100%.",
      );
      return;
    }

    mutate(
      {
        assessmentId,
        values: {
          bloomsDistribution: Object.fromEntries(
            BLOOMS_LEVELS.map((l) => [l, Number(blooms[l]) || 0]),
          ) as UpdateRigorFormValues['bloomsDistribution'],
          difficultyDistribution: Object.fromEntries(
            DIFFICULTY_LEVELS.map((l) => [l, Number(difficulty[l]) || 0]),
          ) as UpdateRigorFormValues['difficultyDistribution'],
        },
      },
      { onSuccess: () => onCompleted() },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Academic rigor</h3>
        <p className="text-sm text-muted-foreground">
          Set the target percentage distribution across Bloom's Taxonomy
          levels and question difficulty. Each must total exactly 100%.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <FieldLabel>Bloom's Taxonomy distribution</FieldLabel>
          <span
            className={`text-sm ${
              bloomsTotal === 100 ? 'text-green-600' : 'text-amber-600'
            }`}
          >
            {bloomsTotal}%
          </span>
        </div>
        {BLOOMS_LEVELS.map((level) => (
          <div key={level} className="flex items-center gap-3">
            <span className="w-28 text-sm">{BLOOMS_LABELS[level]}</span>
            <Input
              type="number"
              className="w-24"
              value={blooms[level]}
              onChange={(e) =>
                setBlooms((prev) => ({ ...prev, [level]: e.target.value }))
              }
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <FieldLabel>Difficulty distribution</FieldLabel>
          <span
            className={`text-sm ${
              difficultyTotal === 100 ? 'text-green-600' : 'text-amber-600'
            }`}
          >
            {difficultyTotal}%
          </span>
        </div>
        {DIFFICULTY_LEVELS.map((level) => (
          <div key={level} className="flex items-center gap-3">
            <span className="w-28 text-sm">{DIFFICULTY_LABELS[level]}</span>
            <Input
              type="number"
              className="w-24"
              value={difficulty[level]}
              onChange={(e) =>
                setDifficulty((prev) => ({ ...prev, [level]: e.target.value }))
              }
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        ))}
      </div>

      {validationError && <p className="text-sm text-red-600">{validationError}</p>}
      {error && (
        <p className="text-sm text-red-600">
          {error instanceof Error ? error.message : 'Failed to save rigor settings'}
        </p>
      )}

      <Button type="submit" disabled={isPending || !bothValid}>
        {isPending ? 'Saving...' : 'Continue'}
      </Button>
    </form>
  );
}