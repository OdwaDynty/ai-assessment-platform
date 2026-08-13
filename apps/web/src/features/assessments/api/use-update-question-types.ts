// apps/web/src/features/assessments/api/use-update-question-types.ts
//
// Step 3: replaces the assessment's full set of question type
// configurations. The backend returns { assessment, marksWarning },
// so this hook's return type reflects that shape — the component uses
// marksWarning to show a soft, non-blocking nudge to the educator.

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { env } from '@/lib/env';
import type {
  AssessmentRecord,
  UpdateQuestionTypesFormValues,
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

interface UpdateQuestionTypesInput {
  assessmentId: string;
  values: UpdateQuestionTypesFormValues;
}

interface UpdateQuestionTypesResponse {
  assessment: AssessmentRecord;
  marksWarning: string | null;
}

async function updateQuestionTypes({
  assessmentId,
  values,
}: UpdateQuestionTypesInput): Promise<UpdateQuestionTypesResponse> {
  const authHeader = await getAuthHeader();

  const res = await fetch(
    `${env.NEXT_PUBLIC_API_URL}/assessments/${assessmentId}/question-types`,
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
    throw new Error(body?.message ?? `Failed to update question types: ${res.status}`);
  }

  return res.json();
}

export function useUpdateQuestionTypes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateQuestionTypes,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['assessment', variables.assessmentId],
      });
    },
  });
}