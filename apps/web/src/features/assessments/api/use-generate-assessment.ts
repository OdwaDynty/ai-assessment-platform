// apps/web/src/features/assessments/api/use-generate-assessment.ts
//
// Triggers Phase 8 AI question generation for a fully-configured
// assessment. Returns immediately (generation runs async via BullMQ) --
// progress is tracked by polling useAssessment, which reads
// Assessment.status and each AssessmentQuestionTypeConfig.generationStatus.

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

async function generateAssessment(assessmentId: string): Promise<{ message: string }> {
  const authHeader = await getAuthHeader();

  const res = await fetch(
    `${env.NEXT_PUBLIC_API_URL}/assessments/${assessmentId}/generate`,
    {
      method: 'POST',
      headers: { Authorization: authHeader },
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Failed to start generation: ${res.status}`);
  }

  return res.json();
}

export function useGenerateAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateAssessment,
    onSuccess: (_data, assessmentId) => {
      queryClient.invalidateQueries({ queryKey: ['assessment', assessmentId] });
    },
  });
}