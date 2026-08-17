'use client';

import Link from 'next/link';
import { useCurrentUser } from '@/features/users/api/use-current-user';
import { ProfileForm } from '@/features/users/components/profile-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  const { data, isLoading, isError, error } = useCurrentUser();

  return (
    <main className="flex min-h-screen flex-col items-center p-8 pt-16">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold text-foreground mb-1">My Profile</h1>
        <p className="text-sm text-muted-foreground mb-6">
          View and update your account details.
        </p>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Account details</CardTitle>
          <Link href="/dashboard">
            <Button variant="outline">Back</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-muted-foreground">Loading profile...</p>}

          {isError && (
            <p className="text-red-600">
              {error instanceof Error ? error.message : 'Failed to load profile'}
            </p>
          )}

          {data && <ProfileForm user={data} />}
        </CardContent>
      </Card>
    </main>
  );
}