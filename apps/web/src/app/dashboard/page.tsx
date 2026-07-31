'use client';

import { useCurrentUser } from '@/features/dashboard/api/use-current-user';
import { SignOutButton } from '@/features/auth/components/sign-out-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const { data, isLoading, isError, error } = useCurrentUser();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Dashboard</CardTitle>
          <SignOutButton />
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