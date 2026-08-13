// apps/web/src/features/assessments/components/steps/step2-basics.tsx
//
// Step 2 of the Assessment Configuration wizard: title, module, NQF
// level, assessment type, duration, total marks, plus a dynamic list
// of learning outcomes (add/remove rows with code + description).
// Uses plain useState for form fields, matching the codebase's existing
// pattern (see document-upload-form.tsx) rather than React Hook Form.

'use client';

import { useState } from 'react';
import { useUpdateBasics } from '../../api/use-update-basics';
import {
  NQF_LEVELS,
  ASSESSMENT_TYPES,
} from '../../schemas/assessment.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LearningOutcomeRow {
  code: string;
  description: string;
}

interface Step2BasicsProps {
  assessmentId: string;
  onCompleted: () => void;
}

export function Step2Basics({ assessmentId, onCompleted }: Step2BasicsProps) {
  const [title, setTitle] = useState('');
  const [moduleName, setModuleName] = useState('');
  const [nqfLevel, setNqfLevel] = useState<string>('LEVEL_7');
  const [assessmentType, setAssessmentType] = useState<string>('TEST');
  const [totalDurationMinutes, setTotalDurationMinutes] = useState('');
  const [totalMarks, setTotalMarks] = useState('');
  const [outcomes, setOutcomes] = useState<LearningOutcomeRow[]>([
    { code: 'LO1', description: '' },
  ]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { mutate, isPending, error } = useUpdateBasics();

  function addOutcome() {
    setOutcomes((prev) => [
      ...prev,
      { code: `LO${prev.length + 1}`, description: '' },
    ]);
  }

  function removeOutcome(index: number) {
    setOutcomes((prev) => prev.filter((_, i) => i !== index));
  }

  function updateOutcome(index: number, field: keyof LearningOutcomeRow, value: string) {
    setOutcomes((prev) =>
      prev.map((o, i) => (i === index ? { ...o, [field]: value } : o)),
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);

    if (!title.trim() || !moduleName.trim()) {
      setValidationError('Title and module name are required.');
      return;
    }
    const duration = Number(totalDurationMinutes);
    const marks = Number(totalMarks);
    if (!duration || duration < 1) {
      setValidationError('Enter a valid duration in minutes.');
      return;
    }
    if (!marks || marks < 1) {
      setValidationError('Enter a valid total marks value.');
      return;
    }
    if (outcomes.some((o) => !o.code.trim() || !o.description.trim())) {
      setValidationError('Every learning outcome needs a code and description.');
      return;
    }

    mutate(
      {
        assessmentId,
        values: {
          title: title.trim(),
          moduleName: moduleName.trim(),
          nqfLevel: nqfLevel as (typeof NQF_LEVELS)[number],
          assessmentType: assessmentType as (typeof ASSESSMENT_TYPES)[number],
          totalDurationMinutes: duration,
          totalMarks: marks,
          learningOutcomes: outcomes,
        },
      },
      { onSuccess: () => onCompleted() },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field>
        <FieldLabel>Title</FieldLabel>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>

      <Field>
        <FieldLabel>Module name</FieldLabel>
        <Input value={moduleName} onChange={(e) => setModuleName(e.target.value)} />
      </Field>

      <Field>
        <FieldLabel>NQF level</FieldLabel>
        <Select value={nqfLevel} onValueChange={(v) => v && setNqfLevel(v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NQF_LEVELS.map((level) => (
              <SelectItem key={level} value={level}>
                {level.replace('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel>Assessment type</FieldLabel>
        <Select value={assessmentType} onValueChange={(v) => v && setAssessmentType(v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ASSESSMENT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel>Duration (minutes)</FieldLabel>
        <Input
          type="number"
          value={totalDurationMinutes}
          onChange={(e) => setTotalDurationMinutes(e.target.value)}
        />
      </Field>

      <Field>
        <FieldLabel>Total marks</FieldLabel>
        <Input
          type="number"
          value={totalMarks}
          onChange={(e) => setTotalMarks(e.target.value)}
        />
      </Field>

      <div className="space-y-2">
        <FieldLabel>Learning outcomes</FieldLabel>
        {outcomes.map((outcome, index) => (
          <div key={index} className="flex gap-2 items-start">
            <Input
              className="w-20"
              value={outcome.code}
              onChange={(e) => updateOutcome(index, 'code', e.target.value)}
              placeholder="LO1"
            />
            <Input
              className="flex-1"
              value={outcome.description}
              onChange={(e) => updateOutcome(index, 'description', e.target.value)}
              placeholder="Outcome description"
            />
            {outcomes.length > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => removeOutcome(index)}
              >
                Remove
              </Button>
            )}
          </div>
        ))}
        <Button type="button" variant="outline" onClick={addOutcome}>
          + Add outcome
        </Button>
      </div>

      {validationError && <p className="text-sm text-red-600">{validationError}</p>}
      {error && (
        <p className="text-sm text-red-600">
          {error instanceof Error ? error.message : 'Failed to save basics'}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Saving...' : 'Continue'}
      </Button>
    </form>
  );
}