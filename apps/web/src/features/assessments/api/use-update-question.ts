// apps/web/src/features/assessments/api/use-update-question.ts
//
// Phase 9: manually edits a single generated question's text, marks,
// or memorandum. Follows the same auth-header pattern used throughout
// this feature.

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { env } from '@/lib/env';
import type { QuestionRecord } from '../schemas/assessment.schema';

async function getAuthHeader() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  return `Bearer ${session.access_token}`;
}

interface UpdateQuestionInput {
  questionId: string;
  assessmentId: string; // used to invalidate the right cache entry, not sent to the API
  values: {
    questionText?: string;
    memorandum?: string;
    marks?: number;
  };
}

async function updateQuestion({
  questionId,
  values,
}: UpdateQuestionInput): Promise<QuestionRecord> {
  const authHeader = await getAuthHeader();

  const res = await fetch(
    `${env.NEXT_PUBLIC_API_URL}/assessments/questions/${questionId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(values),
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Failed to update question: ${res.status}`);
  }

  return res.json();
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateQuestion,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['assessment', variables.assessmentId],
      });
    },
  });
}