// apps/web/src/features/question-bank/api/use-save-to-bank.ts
//
// Saves an existing assessment question into the user's question bank
// as a standalone copy. Follows the same auth-header pattern used
// throughout the assessments feature.

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { env } from '@/lib/env';
import type { BankQuestionRecord } from '../schemas/bank-question.schema';

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

async function saveToBank(questionId: string): Promise<BankQuestionRecord> {
  const authHeader = await getAuthHeader();

  const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/bank-questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify({ questionId }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Failed to save to bank: ${res.status}`);
  }

  return res.json();
}

export function useSaveToBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveToBank,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-questions'] });
    },
  });
}