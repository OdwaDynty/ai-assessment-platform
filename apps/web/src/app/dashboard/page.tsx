'use client';

import { useCurrentUser } from '@/features/users/api/use-current-user';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const { data, isLoading, isError, error } = useCurrentUser();

  return (
    <main className="flex flex-col p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground mb-1">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back — here&apos;s your account overview.
        </p>
      </div>
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading && <p className="text-muted-foreground">Loading your profile...</p>}
          {isError && (
            <p className="text-red-600">
              {error instanceof Error ? error.message : 'Failed to load profile'}
            </p>
          )}
          {data && (
            <>
              <p><span className="font-medium">Email:</span> {data.email}</p>
              <p><span className="font-medium">Full name:</span> {data.fullName ?? '—'}</p>
              <p><span className="font-medium">Role:</span> {data.role}</p>
              <p className="text-xs text-muted-foreground">
                Member since {new Date(data.createdAt).toLocaleDateString()}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}