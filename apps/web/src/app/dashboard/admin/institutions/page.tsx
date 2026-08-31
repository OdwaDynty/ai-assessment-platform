'use client';

import Link from 'next/link';
import { useCurrentUser } from '@/features/users/api/use-current-user';
import { useInstitutionsList } from '@/features/institutions/api/use-institutions-list';
import { CreateInstitutionForm } from '@/features/institutions/components/create-institution-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AdminInstitutionsPage() {
  const { data: currentUser, isLoading: isLoadingCurrentUser } = useCurrentUser();
  const { data: institutions, isLoading, isError } = useInstitutionsList();

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
            <p className="text-red-600">You don&apos;t have permission to view this page.</p>
            <Link href="/dashboard" className="mt-4 inline-block">
              <Button variant="outline">Back to dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex flex-col p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground mb-1">Institutions</h1>
        <p className="text-sm text-muted-foreground">
          Create and manage institutions users can be assigned to.
        </p>
      </div>
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>All institutions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <CreateInstitutionForm />
          {isLoading && <p className="text-muted-foreground">Loading institutions...</p>}
          {isError && <p className="text-red-600">Failed to load institutions.</p>}
          {institutions?.length === 0 && (
            <p className="text-sm text-muted-foreground">No institutions yet.</p>
          )}
          <div className="space-y-2">
            {institutions?.map((inst) => (
              <div key={inst.id} className="flex items-center justify-between border-b py-2">
                <span className="text-sm">{inst.name}</span>
                <Badge variant={inst.isActive ? 'success' : 'outline'}>
                  {inst.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}