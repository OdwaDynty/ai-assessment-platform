'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { env } from '@/lib/env';
import type { DocumentRecord } from '../schemas/document.schema';

interface UploadDocumentInput {
  file: File;
  documentType: string;
}

async function getAuthHeader() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  return `Bearer ${session.access_token}`;
}

async function uploadDocument({
  file,
  documentType,
}: UploadDocumentInput): Promise<DocumentRecord> {
  const authHeader = await getAuthHeader();

  // Step 1: create pending document + get signed upload URL
  const createRes = await fetch(`${env.NEXT_PUBLIC_API_URL}/documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      fileSizeBytes: file.size,
      documentType,
    }),
  });

  if (!createRes.ok) {
    const body = await createRes.json().catch(() => null);
    throw new Error(body?.message ?? `Failed to create document: ${createRes.status}`);
  }

  const { document, signedUrl } = await createRes.json();

  // Step 2: upload the actual file directly to Supabase Storage
  const uploadRes = await fetch(signedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error('File upload to storage failed');
  }

  // Step 3: confirm the upload
  const confirmRes = await fetch(
    `${env.NEXT_PUBLIC_API_URL}/documents/${document.id}/confirm`,
    {
      method: 'POST',
      headers: {
        Authorization: authHeader,
      },
    },
  );

  if (!confirmRes.ok) {
    throw new Error(`Failed to confirm upload: ${confirmRes.status}`);
  }

  return confirmRes.json();
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents-list'] });
    },
  });
}