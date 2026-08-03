'use client';

import { useDeleteDocument } from '../api/use-delete-document';
import type { DocumentRecord } from '../schemas/document.schema';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const STATUS_VARIANTS: Record<DocumentRecord['status'], 'default' | 'destructive' | 'secondary'> = {
  PENDING: 'secondary',
  UPLOADED: 'default',
  PROCESSING: 'secondary',
  READY: 'default',
  FAILED: 'destructive',
};

function formatFileSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function DocumentsTable({ documents }: { documents: DocumentRecord[] }) {
  const { mutate: deleteDocument, isPending } = useDeleteDocument();

  if (documents.length === 0) {
    return <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>File name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Status</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((doc) => (
          <TableRow key={doc.id}>
            <TableCell>{doc.fileName}</TableCell>
            <TableCell>{doc.documentType.replace('_', ' ')}</TableCell>
            <TableCell>{formatFileSize(doc.fileSizeBytes)}</TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANTS[doc.status]}>{doc.status}</Badge>
            </TableCell>
            <TableCell>
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => deleteDocument(doc.id)}
              >
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}