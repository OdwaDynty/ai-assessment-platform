// apps/web/src/features/question-bank/api/use-bank-questions-list.ts
//
// Lists the user's saved bank questions, with optional filters by
// question type, Bloom's level, and difficulty.

'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { env } from '@/lib/env';
import type {
  BankQuestionRecord,
  BankQuestionFilters,
} from '../schemas/bank-question.schema';

async function fetchBankQuestions(
  filters: BankQuestionFilters,
): Promise<BankQuestionRecord[]> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const params = new URLSearchParams();
  if (filters.questionType) params.set('questionType', filters.questionType);
  if (filters.bloomsLevel) params.set('bloomsLevel', filters.bloomsLevel);
  if (filters.difficulty) params.set('difficulty', filters.difficulty);

  const res = await fetch(
    `${env.NEXT_PUBLIC_API_URL}/bank-questions?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${session.access_token}` },
    },
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch bank questions: ${res.status}`);
  }

  return res.json();
}

export function useBankQuestionsList(filters: BankQuestionFilters) {
  return useQuery({
    queryKey: ['bank-questions', filters],
    queryFn: () => fetchBankQuestions(filters),
  });
}