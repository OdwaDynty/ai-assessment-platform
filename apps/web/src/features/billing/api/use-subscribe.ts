'use client';

import { useMutation } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { env } from '@/lib/env';
import type { PayfastPayload } from '../schemas/billing.schema';

async function requestSubscribePayload(): Promise<PayfastPayload> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/billing/subscribe`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to start subscription: ${res.status}`);
  }

  return res.json();
}

export function useSubscribe() {
  return useMutation({
    mutationFn: requestSubscribePayload,
  });
}