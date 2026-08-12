// apps/web/src/features/assessments/components/steps/step1-source-documents.tsx
//
// Step 1 of the Assessment Configuration wizard: source document selection.
// Reuses useDocumentsList from the documents feature to show the user's
// existing documents, lets them multi-select via plain checkboxes (no
// shadcn Checkbox component exists yet in this project, so we follow the
// same pragmatic plain-HTML-input pattern already used for the file input
// in document-upload-form.tsx), then calls useCreateAssessment on submit.

'use client';

import { useState } from 'react';
import { useDocumentsList } from '@/features/documents/api/use-documents-list';
import { useCreateAssessment } from '../../api/use-create-assessment';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Step1SourceDocumentsProps {
  // Called once the draft assessment is successfully created, with the
  // new assessment's id — the wizard shell uses this to advance to Step 2
  // and remember which assessment is being configured.
  onCreated: (assessmentId: string) => void;
}

export function Step1SourceDocuments({ onCreated }: Step1SourceDocumentsProps) {
  const { data: documents, isLoading, isError } = useDocumentsList();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { mutate, isPending, error } = useCreateAssessment();

  function toggleDocument(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function handleContinue() {
    if (selectedIds.length === 0) return;
    mutate(
      { documentIds: selectedIds },
      {
        onSuccess: (assessment) => {
          onCreated(assessment.id);
        },
      },
    );
  }

  // Only documents that have finished processing (READY) contain usable
  // chunks/embeddings for RAG — anything still PENDING/PROCESSING or that
  // FAILED can't be grounded against, so we don't offer them as selectable.
  const readyDocuments = documents?.filter((doc) => doc.status === 'READY') ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Select source material</h3>
        <p className="text-sm text-muted-foreground">
          Choose one or more processed documents to ground this assessment in.
        </p>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading documents...</p>}
      {isError && <p className="text-red-600">Failed to load documents.</p>}

      {!isLoading && readyDocuments.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No processed documents available yet. Upload and process a document first.
        </p>
      )}

      <div className="space-y-2">
        {readyDocuments.map((doc) => {
          const isSelected = selectedIds.includes(doc.id);
          return (
            <Card
              key={doc.id}
              className={`cursor-pointer transition-colors ${
                isSelected ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => toggleDocument(doc.id)}
            >
              <CardContent className="flex items-center gap-3 py-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleDocument(doc.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{doc.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.documentType.replace('_', ' ')}
                  </p>
                </div>
                <Badge variant="outline">{doc.status}</Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {error && (
        <p className="text-sm text-red-600">
          {error instanceof Error ? error.message : 'Failed to create assessment'}
        </p>
      )}

      <Button onClick={handleContinue} disabled={selectedIds.length === 0 || isPending}>
        {isPending ? 'Creating...' : 'Continue'}
      </Button>
    </div>
  );
}