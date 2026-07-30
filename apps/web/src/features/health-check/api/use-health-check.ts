'use client';

import { useQuery } from '@tanstack/react-query';
import { env } from '@/lib/env';
import { healthResponseSchema, type HealthResponse } from '@ai-assessment/shared-types';

async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/health`);

  if (!res.ok) {
    throw new Error(`Health check failed with status ${res.status}`);
  }

  const json = await res.json();
  return healthResponseSchema.parse(json);
}

export function useHealthCheck() {
  return useQuery({
    queryKey: ['health-check'],
    queryFn: fetchHealth,
    refetchInterval: 10_000,
  });
}