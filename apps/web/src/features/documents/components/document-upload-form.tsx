'use client';

import { useState } from 'react';
import { useUploadDocument } from '../api/use-upload-document';
import { DOCUMENT_TYPES } from '../schemas/document.schema';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export function DocumentUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('STUDY_GUIDE');
  const [validationError, setValidationError] = useState<string | null>(null);

  const { mutate, isPending, isSuccess, error } = useUploadDocument();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    setValidationError(null);

    if (!selected) {
      setFile(null);
      return;
    }

    if (selected.type !== 'application/pdf') {
      setValidationError('Only PDF files are supported.');
      setFile(null);
      return;
    }

    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setValidationError('File exceeds the 50MB limit.');
      setFile(null);
      return;
    }

    setFile(selected);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setValidationError('Please select a PDF file.');
      return;
    }
    mutate({ file, documentType });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field>
        <FieldLabel>Document type</FieldLabel>
        <Select
           value={documentType}
              onValueChange={(value) => {
                      if (value) setDocumentType(value);
                   }}
          >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DOCUMENT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type.replace('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel>PDF file (max 50MB)</FieldLabel>
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="block w-full text-sm"
        />
      </Field>

      {validationError && <p className="text-sm text-red-600">{validationError}</p>}
      {error && (
        <p className="text-sm text-red-600">
          {error instanceof Error ? error.message : 'Upload failed'}
        </p>
      )}
      {isSuccess && <p className="text-sm text-green-600">Document uploaded successfully.</p>}

      <Button type="submit" disabled={isPending || !file}>
        {isPending ? 'Uploading...' : 'Upload'}
      </Button>
    </form>
  );
}