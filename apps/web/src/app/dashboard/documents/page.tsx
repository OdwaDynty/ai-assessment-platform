'use client';

import Link from 'next/link';
import { useDocumentsList } from '@/features/documents/api/use-documents-list';
import { DocumentUploadForm } from '@/features/documents/components/document-upload-form';
import { DocumentsTable } from '@/features/documents/components/documents-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DocumentsPage() {
  const { data, isLoading, isError } = useDocumentsList();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <Card className="w-full max-w-2xl">
        
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Upload Document</CardTitle>
          <Link href="/dashboard">
            <Button variant="outline">Back</Button>
          </Link>
        </CardHeader>

        <CardContent>
          <DocumentUploadForm />
        </CardContent>
      </Card>

      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>My Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-muted-foreground">Loading documents...</p>}
          {isError && <p className="text-red-600">Failed to load documents.</p>}
          {data && <DocumentsTable documents={data} />}
        </CardContent>
      </Card>
    </main>
  );
}