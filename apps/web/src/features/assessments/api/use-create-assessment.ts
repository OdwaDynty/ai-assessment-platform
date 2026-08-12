// apps/web/src/features/assessments/api/use-create-assessment.ts
//
// Step 1: creates a new DRAFT assessment linked to the selected source
// documents. Mirrors the auth-header pattern in
// features/documents/api/use-upload-document.ts.

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { env } from '@/lib/env';
import type {
  AssessmentRecord,
  CreateAssessmentFormValues,
} from '../schemas/assessment.schema';

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

async function createAssessment(
  input: CreateAssessmentFormValues,
): Promise<AssessmentRecord> {
  const authHeader = await getAuthHeader();

  const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/assessments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Failed to create assessment: ${res.status}`);
  }

  return res.json();
}

export function useCreateAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAssessment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments-list'] });
    },
  });
}