// apps/web/src/features/assessments/components/assessments-table.tsx
//
// Lists the user's assessments (drafts and generated), following the
// same table pattern as features/documents/components/documents-table.tsx.
// Each row links to the assessment's detail page.

'use client';

import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { AssessmentRecord } from '../schemas/assessment.schema';

interface AssessmentsTableProps {
  assessments: AssessmentRecord[];
}

export function AssessmentsTable({ assessments }: AssessmentsTableProps) {
  if (assessments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No assessments yet — create one to get started.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Module</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assessments.map((assessment) => (
          <TableRow key={assessment.id}>
            <TableCell>
              <Link
                href={`/dashboard/assessments/${assessment.id}`}
                className="text-primary hover:underline"
              >
                {assessment.title || '(Untitled draft)'}
              </Link>
            </TableCell>
            <TableCell>{assessment.moduleName || '—'}</TableCell>
            <TableCell>
              <StatusBadge status={assessment.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === 'GENERATED' ? 'default' : status === 'FAILED' ? 'destructive' : 'outline';
  return <Badge variant={variant}>{status}</Badge>;
}