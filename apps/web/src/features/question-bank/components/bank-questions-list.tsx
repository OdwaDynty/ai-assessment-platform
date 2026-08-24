// apps/web/src/features/question-bank/components/bank-questions-list.tsx
//
// Displays the user's saved bank questions with filter dropdowns and
// per-question delete. Mirrors the visual pattern of the generated
// questions display in Step5Review, since these are the same kind of
// content just decoupled from any single assessment.

'use client';

import { useState } from 'react';
import { useBankQuestionsList } from '../api/use-bank-questions-list';
import { useDeleteBankQuestion } from '../api/use-delete-bank-question';
import {
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  BLOOMS_LEVELS,
  DIFFICULTY_LEVELS,
} from '@/features/assessments/schemas/assessment.schema';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function BankQuestionsList() {
  const [questionType, setQuestionType] = useState<string>('ALL');
  const [bloomsLevel, setBloomsLevel] = useState<string>('ALL');
  const [difficulty, setDifficulty] = useState<string>('ALL');

  const { data, isLoading, isError } = useBankQuestionsList({
    questionType: questionType === 'ALL' ? undefined : questionType,
    bloomsLevel: bloomsLevel === 'ALL' ? undefined : bloomsLevel,
    difficulty: difficulty === 'ALL' ? undefined : difficulty,
  });

  const { mutate: deleteQuestion } = useDeleteBankQuestion();

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Select value={questionType} onValueChange={(v) => v && setQuestionType(v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Question type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            {QUESTION_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {QUESTION_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={bloomsLevel} onValueChange={(v) => v && setBloomsLevel(v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Bloom's level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Bloom's levels</SelectItem>
            {BLOOMS_LEVELS.map((level) => (
              <SelectItem key={level} value={level}>
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={difficulty} onValueChange={(v) => v && setDifficulty(v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All difficulties</SelectItem>
            {DIFFICULTY_LEVELS.map((level) => (
              <SelectItem key={level} value={level}>
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading bank questions...</p>}
      {isError && <p className="text-red-600">Failed to load bank questions.</p>}
      {data && data.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No bank questions match these filters.
        </p>
      )}

      {data?.map((q) => (
        <Card key={q.id}>
          <CardContent className="py-4 space-y-2">
            <p className="text-sm font-medium">{q.questionText}</p>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline">{QUESTION_TYPE_LABELS[q.questionType]}</Badge>
              <Badge variant="outline">{q.bloomsLevel}</Badge>
              <Badge variant="outline">{q.difficulty}</Badge>
              <Badge variant="outline">{q.marks} marks</Badge>
            </div>
            {q.sourceAssessmentTitle && (
              <p className="text-xs text-muted-foreground">
                Saved from: {q.sourceAssessmentTitle}
              </p>
            )}
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground">
                Memorandum
              </summary>
              <p className="mt-1 whitespace-pre-wrap">{q.memorandum}</p>
            </details>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm('Remove this question from your bank?')) {
                  deleteQuestion(q.id);
                }
              }}
            >
              Remove
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}