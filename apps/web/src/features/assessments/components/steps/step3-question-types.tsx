// apps/web/src/features/assessments/components/steps/step3-question-types.tsx
//
// Step 3 of the Assessment Configuration wizard: question type
// breakdown. Educator picks from the 5 question types, sets a count
// and marks-per-question for each. The backend's soft marksWarning
// (shown, not blocking) nudges toward reconciling with total marks
// from Step 2, but the educator can still proceed regardless.

'use client';

import { useState } from 'react';
import { useUpdateQuestionTypes } from '../../api/use-update-question-types';
import {
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
} from '../../schemas/assessment.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { FieldLabel } from '@/components/ui/field';

interface QuestionTypeRow {
  questionType: (typeof QUESTION_TYPES)[number];
  questionCount: string;
  marksPerQuestion: string;
}

interface Step3QuestionTypesProps {
  assessmentId: string;
  onCompleted: () => void;
}

export function Step3QuestionTypes({
  assessmentId,
  onCompleted,
}: Step3QuestionTypesProps) {
  // A row is only "active" (included in submission) if selected. All 5
  // types are shown up front so the educator can see the full option
  // set, but only enter counts/marks for the ones they want.
  const [selected, setSelected] = useState<Set<(typeof QUESTION_TYPES)[number]>>(
    new Set(),
  );
  const [rows, setRows] = useState<Record<string, QuestionTypeRow>>(
    Object.fromEntries(
      QUESTION_TYPES.map((type) => [
        type,
        { questionType: type, questionCount: '', marksPerQuestion: '' },
      ]),
    ) as Record<string, QuestionTypeRow>,
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const { mutate, isPending, error, data } = useUpdateQuestionTypes();

  function toggleType(type: (typeof QUESTION_TYPES)[number]) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }

  function updateRow(
    type: string,
    field: 'questionCount' | 'marksPerQuestion',
    value: string,
  ) {
    setRows((prev) => ({ ...prev, [type]: { ...prev[type], [field]: value } }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);

    if (selected.size === 0) {
      setValidationError('Select at least one question type.');
      return;
    }

    const questionTypes = Array.from(selected).map((type) => {
      const row = rows[type];
      return {
        questionType: type,
        questionCount: Number(row.questionCount),
        marksPerQuestion: Number(row.marksPerQuestion),
      };
    });

    if (
      questionTypes.some(
        (qt) => !qt.questionCount || qt.questionCount < 1 || !qt.marksPerQuestion || qt.marksPerQuestion < 1,
      )
    ) {
      setValidationError('Every selected type needs a valid count and marks per question.');
      return;
    }

    mutate(
      { assessmentId, values: { questionTypes } },
      { onSuccess: () => onCompleted() },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Question types</h3>
        <p className="text-sm text-muted-foreground">
          Select the question types this assessment will include, and set how
          many of each and how many marks each is worth.
        </p>
      </div>

      <div className="space-y-2">
        {QUESTION_TYPES.map((type) => {
          const isSelected = selected.has(type);
          return (
            <Card key={type} className={isSelected ? 'border-primary' : ''}>
              <CardContent className="py-3 space-y-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleType(type)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium flex-1">
                    {QUESTION_TYPE_LABELS[type]}
                  </span>
                </div>
                {isSelected && (
                  <div className="flex gap-2 pl-7">
                    <div className="flex-1">
                      <FieldLabel className="text-xs">Count</FieldLabel>
                      <Input
                        type="number"
                        value={rows[type].questionCount}
                        onChange={(e) =>
                          updateRow(type, 'questionCount', e.target.value)
                        }
                      />
                    </div>
                    <div className="flex-1">
                      <FieldLabel className="text-xs">Marks each</FieldLabel>
                      <Input
                        type="number"
                        value={rows[type].marksPerQuestion}
                        onChange={(e) =>
                          updateRow(type, 'marksPerQuestion', e.target.value)
                        }
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {validationError && <p className="text-sm text-red-600">{validationError}</p>}
      {error && (
        <p className="text-sm text-red-600">
          {error instanceof Error ? error.message : 'Failed to save question types'}
        </p>
      )}
      {data?.marksWarning && (
        <p className="text-sm text-amber-600">{data.marksWarning}</p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Saving...' : 'Continue'}
      </Button>
    </form>
  );
}