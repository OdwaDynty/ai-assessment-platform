'use client';

import { useCurrentUser } from '@/features/users/api/use-current-user';
import { ProfileForm } from '@/features/users/components/profile-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProfilePage() {
  const { data, isLoading, isError, error } = useCurrentUser();

  return (
    <main className="flex flex-col p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground mb-1">My Profile</h1>
        <p className="text-sm text-muted-foreground">
          View and update your account details.
        </p>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Account details</CardTitle>
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