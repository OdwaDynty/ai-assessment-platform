import { z } from 'zod';
import { UserRole } from '../../../../../generated/prisma/client';

export const adminUpdateUserSchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
});

export type AdminUpdateUserDto = z.infer<typeof adminUpdateUserSchema>;
