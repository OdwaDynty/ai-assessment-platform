// apps/web/src/features/assessments/api/use-update-basics.ts
//
// Step 2: updates an assessment's basics (title, module, NQF level,
// type, duration, marks) and replaces its full set of learning
// outcomes. Mirrors the auth-header pattern used throughout this feature.

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { env } from '@/lib/env';
import type {
  AssessmentRecord,
  UpdateBasicsFormValues,
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

interface UpdateBasicsInput {
  assessmentId: string;
  values: UpdateBasicsFormValues;
}

async function updateBasics({
  assessmentId,
  values,
}: UpdateBasicsInput): Promise<AssessmentRecord> {
  const authHeader = await getAuthHeader();

  const res = await fetch(
    `${env.NEXT_PUBLIC_API_URL}/assessments/${assessmentId}/basics`,
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
    throw new Error(body?.message ?? `Failed to update basics: ${res.status}`);
  }

  return res.json();
}

export function useUpdateBasics() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBasics,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['assessment', variables.assessmentId],
      });
    },
  });
}