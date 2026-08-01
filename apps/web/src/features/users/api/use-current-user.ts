'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { env } from '@/lib/env';

export interface CurrentUser {
  id: string;
  supabaseId: string;
  email: string;
  fullName: string | null;
  role: string;
  isActive: boolean;
  institutionId: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

async function fetchCurrentUser(): Promise<CurrentUser> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/users/me`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch current user: ${res.status}`);
  }

  return res.json();
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: fetchCurrentUser,
  });
}