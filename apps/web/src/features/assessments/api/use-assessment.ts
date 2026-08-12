// apps/web/src/features/assessments/api/use-assessment.ts
//
// Fetches a single assessment with its full nested wizard state
// (source documents, question type configs, learning outcomes). Used
// throughout the wizard to display current progress and on the final
// review step. Takes the assessment id as a parameter, and is disabled
// (won't fetch) until an id is available — e.g. before Step 1 completes.

'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { env } from '@/lib/env';
import type { AssessmentDetail } from '../schemas/assessment.schema';

async function fetchAssessment(id: string): Promise<AssessmentDetail> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/assessments/${id}`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch assessment: ${res.status}`);
  }

  return res.json();
}

export function useAssessment(id: string | null) {
  return useQuery({
    queryKey: ['assessment', id],
    queryFn: () => fetchAssessment(id as string),
    // Only fetch once we actually have an id — the wizard doesn't have
    // one until Step 1's create-draft call succeeds.
    enabled: id !== null,
  });
}