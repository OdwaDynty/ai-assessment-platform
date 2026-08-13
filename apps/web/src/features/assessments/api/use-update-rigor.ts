// apps/web/src/features/assessments/api/use-update-rigor.ts
//
// Step 4: updates the assessment's Bloom's Taxonomy and difficulty
// distributions. Mirrors the auth-header pattern used throughout
// this feature.

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { env } from '@/lib/env';
import type {
  AssessmentRecord,
  UpdateRigorFormValues,
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

interface UpdateRigorInput {
  assessmentId: string;
  values: UpdateRigorFormValues;
}

async function updateRigor({
  assessmentId,
  values,
}: UpdateRigorInput): Promise<AssessmentRecord> {
  const authHeader = await getAuthHeader();

  const res = await fetch(
    `${env.NEXT_PUBLIC_API_URL}/assessments/${assessmentId}/rigor`,
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
    throw new Error(body?.message ?? `Failed to update rigor: ${res.status}`);
  }

  return res.json();
}

export function useUpdateRigor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRigor,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['assessment', variables.assessmentId],
      });
    },
  });
}