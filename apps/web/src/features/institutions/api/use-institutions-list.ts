'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { env } from '@/lib/env';
import type { InstitutionRecord } from '../schemas/institution.schema';

async function fetchInstitutions(): Promise<InstitutionRecord[]> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/institutions`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch institutions: ${res.status}`);
  }

  return res.json();
}

export function useInstitutionsList() {
  return useQuery({
    queryKey: ['institutions-list'],
    queryFn: fetchInstitutions,
  });
}