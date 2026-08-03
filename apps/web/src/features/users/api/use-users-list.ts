'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { env } from '@/lib/env';
import type { CurrentUser } from './use-current-user';

interface PaginatedUsers {
  data: CurrentUser[];
  total: number;
  page: number;
  pageSize: number;
}

async function fetchUsers(page: number): Promise<PaginatedUsers> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/users?page=${page}`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch users: ${res.status}`);
  }

  return res.json();
}

export function useUsersList(page = 1) {
  return useQuery({
    queryKey: ['users-list', page],
    queryFn: () => fetchUsers(page),
  });
}