'use client';

import { useState } from 'react';
import { useCreateInstitution } from '../api/use-create-institution';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';

export function CreateInstitutionForm() {
  const [name, setName] = useState('');
  const { mutate, isPending, error } = useCreateInstitution();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    mutate(name.trim(), { onSuccess: () => setName('') });
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end">
      <Field className="flex-1">
        <FieldLabel>Institution name</FieldLabel>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Button type="submit" disabled={isPending || !name.trim()}>
        {isPending ? 'Creating...' : 'Create'}
      </Button>
      {error && (
        <p className="text-sm text-red-600">
          {error instanceof Error ? error.message : 'Failed to create institution'}
        </p>
      )}
    </form>
  );
}