'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfileSchema, type UpdateProfileFormValues } from '../schemas/profile.schema';
import { useUpdateProfile } from '../api/use-update-profile';
import type { CurrentUser } from '../api/use-current-user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';

export function ProfileForm({ user }: { user: CurrentUser }) {
  const { mutate, isPending, isSuccess, error } = useUpdateProfile();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { fullName: user.fullName ?? '' },
  });

  useEffect(() => {
    reset({ fullName: user.fullName ?? '' });
  }, [user.fullName, reset]);

  function onSubmit(values: UpdateProfileFormValues) {
    mutate(values);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field>
        <FieldLabel>Email</FieldLabel>
        <Input value={user.email} disabled />
      </Field>

      <Field>
        <FieldLabel>Role</FieldLabel>
        <Input value={user.role} disabled />
      </Field>

      <Controller
        name="fullName"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Full name</FieldLabel>
            <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {error && (
        <p className="text-sm text-red-600">
          {error instanceof Error ? error.message : 'Failed to update profile'}
        </p>
      )}

      {isSuccess && <p className="text-sm text-green-600">Profile updated.</p>}

      <Button type="submit" disabled={isPending || !isDirty}>
        {isPending ? 'Saving...' : 'Save changes'}
      </Button>
    </form>
  );
}