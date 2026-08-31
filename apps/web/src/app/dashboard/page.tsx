'use client';

import Link from 'next/link';
import { useCurrentUser } from '@/features/users/api/use-current-user';
import { SignOutButton } from '@/features/auth/components/sign-out-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';


export default function DashboardPage() {
  const { data, isLoading, isError, error } = useCurrentUser();

  return (
    <main className="flex min-h-screen flex-col items-center p-8 pt-16">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold text-foreground mb-1">Dashboard</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Welcome back — here's your account overview.
        </p>
      </div>
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
           <CardTitle>Account</CardTitle>
            <div className="flex gap-2 flex-wrap">
              {data?.role === 'PLATFORM_ADMIN' && (
                <Link href="/dashboard/admin/users">
                 <Button variant="outline">Manage Users</Button>
                </Link>
               )}
              <Link href="/dashboard/profile">
               <Button variant="outline">My Profile</Button>
            </Link>
            <Link href="/dashboard/documents">
              <Button variant="outline">Documents</Button>
            </Link>
            <Link href="/dashboard/assessments">
              <Button variant="outline">Assessments</Button>
            </Link>
                        <Link href="/dashboard/question-bank">
              <Button variant="outline">Question Bank</Button>
            </Link>
                      <Link href="/dashboard/billing">
              <Button variant="outline">Billing</Button>
            </Link>
            <SignOutButton />
          </div>
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