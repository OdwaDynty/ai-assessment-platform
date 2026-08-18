// apps/web/src/features/assessments/api/use-delete-question.ts
//
// Phase 10: deletes a single generated question. Follows the same
// auth-header pattern used throughout this feature.

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { env } from '@/lib/env';

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

interface DeleteQuestionInput {
  questionId: string;
  assessmentId: string; // used to invalidate the right cache entry, not sent to the API
}

async function deleteQuestion({ questionId }: DeleteQuestionInput): Promise<void> {
  const authHeader = await getAuthHeader();

  const res = await fetch(
    `${env.NEXT_PUBLIC_API_URL}/assessments/questions/${questionId}`,
    {
      method: 'DELETE',
      headers: { Authorization: authHeader },
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Failed to delete question: ${res.status}`);
  }
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteQuestion,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['assessment', variables.assessmentId],
      });
    },
  });
}