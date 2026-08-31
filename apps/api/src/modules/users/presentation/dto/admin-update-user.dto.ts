// apps/api/src/modules/users/presentation/dto/admin-update-user.dto.ts

import { z } from 'zod';
import { UserRole } from '../../../../../generated/prisma/client';

export const adminUpdateUserSchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
  // Institution assignment is a separate concern from role/active
  // toggling -- see UsersService.adminUpdateUser for why only
  // PLATFORM_ADMIN can set this field, even though INSTITUTION_ADMIN
  // can now call this same endpoint for role/isActive changes.
  institutionId: z.string().uuid().nullable().optional(),
});

export type AdminUpdateUserDto = z.infer<typeof adminUpdateUserSchema>;