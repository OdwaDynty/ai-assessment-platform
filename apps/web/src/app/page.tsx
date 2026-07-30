'use client';

import { useHealthCheck } from '@/features/health-check/api/use-health-check';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const { data, isLoading, isError, error } = useHealthCheck();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>System Health Check</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading && <p className="text-muted-foreground">Checking backend connectivity...</p>}

          {isError && (
            <p className="text-red-600">
              Failed to reach backend: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          )}

          {data && (
            <>
              <p>
                <span className="font-medium">API status:</span>{' '}
                <span className={data.status === 'ok' ? 'text-green-600' : 'text-red-600'}>
                  {data.status}
                </span>
              </p>
              <p>
                <span className="font-medium">Database:</span>{' '}
                <span className={data.database === 'connected' ? 'text-green-600' : 'text-red-600'}>
                  {data.database}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                Last checked: {new Date(data.timestamp).toLocaleTimeString()}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}