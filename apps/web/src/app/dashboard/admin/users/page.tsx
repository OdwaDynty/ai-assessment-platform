'use client';

import Link from 'next/link';
import { useCurrentUser } from '@/features/users/api/use-current-user';
import { useUsersList } from '@/features/users/api/use-users-list';
import { UsersTable } from '@/features/users/components/users-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminUsersPage() {
  const { data: currentUser, isLoading: isLoadingCurrentUser } = useCurrentUser();
  const { data: usersList, isLoading: isLoadingUsers, isError } = useUsersList();

  if (isLoadingCurrentUser) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <p className="text-muted-foreground">Loading...</p>
      </main>
    );
  }

  if (currentUser?.role !== 'PLATFORM_ADMIN') {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-red-600">
              You don&apos;t have permission to view this page.
            </p>
            <Link href="/dashboard" className="mt-4 inline-block">
              <Button variant="outline">Back to dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <Card className="w-full max-w-3xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>User Management</CardTitle>
          <Link href="/dashboard">
            <Button variant="outline">Back</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {isLoadingUsers && <p className="text-muted-foreground">Loading users...</p>}
          {isError && <p className="text-red-600">Failed to load users.</p>}
          {usersList && (
            <>
              <UsersTable users={usersList.data} />
              <p className="mt-4 text-xs text-muted-foreground">
                Showing {usersList.data.length} of {usersList.total} users
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}