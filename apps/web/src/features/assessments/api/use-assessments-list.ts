// apps/web/src/features/assessments/api/use-assessments-list.ts
//
// Fetches all of the current user's assessments (drafts and otherwise),
// for a future "My Assessments" / resume-draft screen. Mirrors
// features/documents/api/use-documents-list.ts exactly.

'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { env } from '@/lib/env';
import type { AssessmentRecord } from '../schemas/assessment.schema';

async function fetchAssessments(): Promise<AssessmentRecord[]> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/assessments`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch assessments: ${res.status}`);
  }

  return res.json();
}

export function useAssessmentsList() {
  return useQuery({
    queryKey: ['assessments-list'],
    queryFn: fetchAssessments,
  });
}