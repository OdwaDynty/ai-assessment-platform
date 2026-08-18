// apps/web/src/features/assessments/components/steps/step5-review.tsx
//
// Step 5 of the Assessment Configuration wizard: final review screen,
// now extended for Phase 8 to trigger AI generation and display the
// generated questions once available. Polls useAssessment while
// generation is in progress so status updates appear live without a
// manual refresh.

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAssessment } from '../../api/use-assessment';
import { useGenerateAssessment } from '../../api/use-generate-assessment';
import {
  QUESTION_TYPE_LABELS,
  type QUESTION_TYPES,
} from '../../schemas/assessment.schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { useUpdateQuestion } from '../../api/use-update-question';
import { Input } from '@/components/ui/input';
import { useDeleteQuestion } from '../../api/use-delete-question';
import { useReorderQuestion } from '../../api/use-reorder-question';

interface Step5ReviewProps {
  assessmentId: string;
}

// Polling interval while generation is in progress. 3 seconds is
// frequent enough to feel responsive without hammering the API.
const POLL_INTERVAL_MS = 3000;

export function Step5Review({ assessmentId }: Step5ReviewProps) {
  const { data: assessment, isLoading, isError, refetch } = useAssessment(assessmentId);
  const { mutate: generate, isPending: isTriggering, error: triggerError } =
    useGenerateAssessment();

  const isGenerating = assessment?.status === 'GENERATING';

  // Poll while generation is running. Stops automatically once the
  // assessment's status leaves GENERATING (either GENERATED or FAILED).
  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      refetch();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isGenerating, refetch]);

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
          <div key={qt.id} className="flex items-center gap-2">
            <p className="text-sm flex-1">
              {QUESTION_TYPE_LABELS[qt.questionType as (typeof QUESTION_TYPES)[number]]}
              : {qt.questionCount} × {qt.marksPerQuestion} marks ={' '}
              {qt.questionCount * qt.marksPerQuestion} marks
            </p>
            <GenerationStatusBadge status={qt.generationStatus} />
          </div>
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

      {/* Generation trigger + status */}
      <Card>
        <CardContent className="py-4 space-y-3">
          {assessment.status === 'DRAFT' && (
            <>
              <p className="text-sm text-muted-foreground">
                This assessment is fully configured and ready for AI generation.
              </p>
              <Button
                onClick={() => generate(assessmentId)}
                disabled={isTriggering}
              >
                {isTriggering ? 'Starting...' : 'Generate Assessment'}
              </Button>
              {triggerError && (
                <p className="text-sm text-red-600">
                  {triggerError instanceof Error
                    ? triggerError.message
                    : 'Failed to start generation'}
                </p>
              )}
            </>
          )}

          {isGenerating && (
            <p className="text-sm text-blue-600">
              Generating questions... this page will update automatically.
            </p>
          )}

          {assessment.status === 'GENERATED' && (
            <p className="text-sm text-green-600">
              Generation complete — {assessment.questions.length} question(s) generated.
            </p>
          )}

          {assessment.status === 'FAILED' && (
            <>
              <p className="text-sm text-red-600">
                Generation failed for one or more question types. See details below.
              </p>
              <Button onClick={() => generate(assessmentId)} disabled={isTriggering}>
                {isTriggering ? 'Retrying...' : 'Retry Generation'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Generated questions display */}
      {assessment.questions.length > 0 && (
        <>
          <Separator />
          <section className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground">
              Generated questions ({assessment.questions.length})
            </h4>
            {assessment.questions.map((q, i) => (
              <EditableQuestionCard
                key={q.id}
                question={q}
                index={i}
                assessmentId={assessmentId}
                isFirst={i === 0}
                isLast={i === assessment.questions.length - 1}
              />
            ))}
          </section>
        </>
      )}

      <Link href="/dashboard">
        <Button variant="outline">Back to dashboard</Button>
      </Link>
    </div>
  );
}

function GenerationStatusBadge({ status }: { status: string }) {
  const variant =
    status === 'GENERATED'
      ? 'success'
      : status === 'FAILED'
        ? 'destructive'
        : 'outline';
  return <Badge variant={variant}>{status}</Badge>;
}

// Renders type-specific optionsData: MCQ shows labeled options with the
// correct one highlighted; True/False shows the correct answer. Other
// question types (SHORT_ANSWER, ESSAY, SCENARIO_BASED) have null
// optionsData and render nothing here -- their answer lives entirely
// in the memorandum.
function QuestionOptions({ optionsData }: { optionsData: unknown }) {
  if (!optionsData) return null;

  // MCQ shape: array of { label, text, isCorrect }
  if (Array.isArray(optionsData)) {
    return (
      <div className="space-y-1 pl-1">
        {optionsData.map((option: { label: string; text: string; isCorrect: boolean }) => (
          <div
            key={option.label}
            className={`text-sm flex gap-2 px-2 py-1 rounded ${
              option.isCorrect
                ? 'bg-green-50 text-green-800 font-medium'
                : 'text-muted-foreground'
            }`}
          >
            <span>{option.label}.</span>
            <span>{option.text}</span>
            {option.isCorrect && <span className="ml-auto text-xs">✓ Correct</span>}
          </div>
        ))}
      </div>
    );
  }

  // True/False shape: { correctAnswer: boolean }
  if (
    typeof optionsData === 'object' &&
    optionsData !== null &&
    'correctAnswer' in optionsData
  ) {
    const correctAnswer = (optionsData as { correctAnswer: boolean }).correctAnswer;
    return (
      <p className="text-sm text-green-700 font-medium">
        Correct answer: {correctAnswer ? 'True' : 'False'}
      </p>
    );
  }

  return null;
}

// Renders a single generated question with an inline edit toggle.
// Editing covers questionText, marks, and memorandum -- optionsData
// (MCQ options/correct answer) is intentionally not editable here, per
// the Phase 9 scoping decision to keep the first editing slice simple
// and avoid the risk of a free-text edit producing zero or multiple
// correct MCQ answers.
function EditableQuestionCard({
  question,
  index,
  assessmentId,
  isFirst,
  isLast,
  }: {
  question: import('../../schemas/assessment.schema').QuestionRecord;
  index: number;
  assessmentId: string;
  isFirst: boolean;
  isLast: boolean;
  }) {
  const [isEditing, setIsEditing] = useState(false);
  const [questionText, setQuestionText] = useState(question.questionText);
  const [marks, setMarks] = useState(String(question.marks));
  const [memorandum, setMemorandum] = useState(question.memorandum);

  // MCQ-specific editable state: only meaningful when question.optionsData
  // is an array (MCQ type). Initialized from the current options, or a
  // blank 4-option template if this question somehow has none.
  const isMcq = Array.isArray(question.optionsData);
  const [options, setOptions] = useState<Array<{ label: string; text: string; isCorrect: boolean }>>(
    isMcq
      ? (question.optionsData as Array<{ label: string; text: string; isCorrect: boolean }>)
      : [
          { label: 'A', text: '', isCorrect: true },
          { label: 'B', text: '', isCorrect: false },
          { label: 'C', text: '', isCorrect: false },
          { label: 'D', text: '', isCorrect: false },
        ],
  );

     function updateOptionText(index: number, text: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, text } : o)));
    }

  function setCorrectOption(index: number) {
    setOptions((prev) => prev.map((o, i) => ({ ...o, isCorrect: i === index })));
    }


  const { mutate, isPending, error } = useUpdateQuestion();
  const { mutate: deleteQuestion, isPending: isDeleting } = useDeleteQuestion();
  const { mutate: reorderQuestion, isPending: isReordering } = useReorderQuestion();

  function handleDelete() {
    if (!confirm('Delete this question? This cannot be undone.')) return;
    deleteQuestion({ questionId: question.id, assessmentId });
  }

 function handleSave() {
    mutate(
      {
        questionId: question.id,
        assessmentId,
        values: {
          questionText,
          marks: Number(marks),
          memorandum,
          ...(isMcq && { optionsData: options }),
        },
      },
      { onSuccess: () => setIsEditing(false) },
    );
  }

  function handleCancel() {
    setQuestionText(question.questionText);
    setMarks(String(question.marks));
    setMemorandum(question.memorandum);
    if (isMcq) {
      setOptions(question.optionsData as Array<{ label: string; text: string; isCorrect: boolean }>);
    }
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <Card>
        <CardContent className="py-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Editing Q{index + 1}</p>

          <div>
            <label className="text-xs text-muted-foreground">Question text</label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm min-h-20"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Marks</label>
            <Input
              type="number"
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              className="w-24 mt-1"
            />
          </div>

          {isMcq && (
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">
                Options (select the correct one)
              </label>
              {options.map((option, i) => (
                <div key={option.label} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-option-${question.id}`}
                    checked={option.isCorrect}
                    onChange={() => setCorrectOption(i)}
                    className="h-4 w-4"
                  />
                  <span className="w-6 text-sm text-muted-foreground">{option.label}.</span>
                  <Input
                    value={option.text}
                    onChange={(e) => updateOptionText(i, e.target.value)}
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground">Memorandum</label>
            <textarea
              value={memorandum}
              onChange={(e) => setMemorandum(e.target.value)}
              className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm min-h-32"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">
              {error instanceof Error ? error.message : 'Failed to save changes'}
            </p>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={isPending}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium flex-1">
            Q{index + 1}. {question.questionText}
          </p>
          <Badge variant="outline">{question.marks} marks</Badge>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline">{question.bloomsLevel}</Badge>
          <Badge variant="outline">{question.difficulty}</Badge>
          {question.learningOutcomeLinks.map((link) => (
            <Badge key={link.id} variant="outline">
              {link.learningOutcome.code}
            </Badge>
          ))}
        </div>
        <QuestionOptions optionsData={question.optionsData} />

        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground">Memorandum</summary>
          <p className="mt-1 whitespace-pre-wrap">{question.memorandum}</p>
        </details>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isFirst || isReordering}
            onClick={() =>
              reorderQuestion({ questionId: question.id, assessmentId, direction: 'up' })
            }
          >
            ↑
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isLast || isReordering}
            onClick={() =>
              reorderQuestion({ questionId: question.id, assessmentId, direction: 'down' })
            }
          >
            ↓
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}