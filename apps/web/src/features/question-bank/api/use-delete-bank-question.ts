// apps/web/src/features/question-bank/api/use-delete-bank-question.ts
//
// Deletes a single bank question.

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

async function deleteBankQuestion(id: string): Promise<void> {
  const authHeader = await getAuthHeader();

  const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/bank-questions/${id}`, {
    method: 'DELETE',
    headers: { Authorization: authHeader },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Failed to delete bank question: ${res.status}`);
  }
}

export function useDeleteBankQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBankQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-questions'] });
    },
  });
}