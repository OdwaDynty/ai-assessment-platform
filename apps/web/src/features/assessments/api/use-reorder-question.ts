// apps/web/src/features/assessments/api/use-reorder-question.ts
//
// Phase 10: moves a question up or down one position within its
// assessment. Follows the same auth-header pattern used throughout
// this feature.

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

interface ReorderQuestionInput {
  questionId: string;
  assessmentId: string; // used to invalidate the right cache entry, not sent to the API
  direction: 'up' | 'down';
}

async function reorderQuestion({
  questionId,
  direction,
}: ReorderQuestionInput): Promise<void> {
  const authHeader = await getAuthHeader();

  const res = await fetch(
    `${env.NEXT_PUBLIC_API_URL}/assessments/questions/${questionId}/reorder`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({ direction }),
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Failed to reorder question: ${res.status}`);
  }
}

export function useReorderQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderQuestion,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['assessment', variables.assessmentId],
      });
    },
  });
}