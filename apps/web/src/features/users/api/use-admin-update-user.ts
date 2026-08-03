'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { env } from '@/lib/env';

interface AdminUpdateUserPayload {
  userId: string;
  role?: string;
  isActive?: boolean;
}

async function adminUpdateUser({ userId, ...updates }: AdminUpdateUserPayload) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    throw new Error(`Failed to update user: ${res.status}`);
  }

  return res.json();
}

export function useAdminUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminUpdateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
    },
  });
}