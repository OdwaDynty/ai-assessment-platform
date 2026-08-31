// apps/api/src/modules/users/application/users.service.ts

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { User } from '../../../../generated/prisma/client';
import type { UpdateProfileDto } from '../presentation/dto/update-profile.dto';
import type { AdminUpdateUserDto } from '../presentation/dto/admin-update-user.dto';

export interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateOwnProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
  }

  /**
   * Lists users, scoped by the acting user's role:
   * - PLATFORM_ADMIN sees everyone.
   * - INSTITUTION_ADMIN sees only users in their own institution. If
   *   they have no institution assigned, they see nobody (an empty
   *   list) rather than accidentally seeing everyone -- fixing the
   *   bug where this endpoint previously ignored role/institution
   *   scoping entirely and returned all users to anyone allowed to
   *   call it.
   */
  async findAll(
    actingUser: User,
    page = 1,
    pageSize = 20,
  ): Promise<PaginatedUsers> {
    const skip = (page - 1) * pageSize;

    const where =
      actingUser.role === 'PLATFORM_ADMIN'
        ? {}
        : { institutionId: actingUser.institutionId ?? '__none__' };
    // '__none__' can never match a real institutionId, so an
    // INSTITUTION_ADMIN with no institution assigned correctly sees
    // zero users instead of every user (institutionId: null would
    // otherwise match all OTHER un-assigned users, which is wrong).

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  /**
   * Updates a target user's role, active status, and/or institution
   * assignment.
   *
   * - PLATFORM_ADMIN can update any user, including institutionId.
   * - INSTITUTION_ADMIN can update role/isActive, but ONLY for users
   *   already within their own institution -- and can never set
   *   institutionId themselves (institution assignment/reassignment
   *   stays a platform-level decision, since an institution admin
   *   granting themselves or others access to a different institution
   *   would be a privilege-escalation risk).
   */
  async adminUpdateUser(
    targetUserId: string,
    dto: AdminUpdateUserDto,
    actingUser: User,
  ): Promise<User> {
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!target) {
      throw new NotFoundException('User not found');
    }

    if (actingUser.role === 'PLATFORM_ADMIN') {
      return this.prisma.user.update({
        where: { id: targetUserId },
        data: dto,
      });
    }

    if (actingUser.role === 'INSTITUTION_ADMIN') {
      if (
        !actingUser.institutionId ||
        target.institutionId !== actingUser.institutionId
      ) {
        throw new ForbiddenException(
          'You can only manage users within your own institution',
        );
      }
      if (dto.institutionId !== undefined) {
        throw new ForbiddenException(
          'Only platform admins can change a user\'s institution assignment',
        );
      }

      return this.prisma.user.update({
        where: { id: targetUserId },
        data: { role: dto.role, isActive: dto.isActive },
      });
    }

    throw new ForbiddenException(
      'Only platform or institution admins can update other users',
    );
  }
}