// apps/api/src/modules/users/application/users.service.spec.ts
//
// Tests UsersService's institution-scoping and privilege-escalation
// logic with a mocked PrismaService -- this is regression protection
// for a real security bug found and fixed during Phase 13: GET /users
// previously ignored role/institution scoping entirely and returned
// every user to anyone authorized to call it.

import { Test } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../../../prisma/prisma.service';
import type { User } from '../../../../generated/prisma/client';

// Minimal fake PrismaService: only implements the methods this
// service actually calls, with jest.fn() so we can assert on how
// they were invoked (e.g. what `where` clause was passed).
function createMockPrisma() {
  return {
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
}

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    supabaseId: 'supabase-1',
    email: 'test@example.com',
    fullName: null,
    role: 'EDUCATOR',
    isActive: true,
    institutionId: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('UsersService', () => {
  let service: UsersService;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeEach(async () => {
    prisma = createMockPrisma();
    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  describe('findAll', () => {
    it('applies no where filter for a PLATFORM_ADMIN, seeing every user', async () => {
      const admin = makeUser({ role: 'PLATFORM_ADMIN' });
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.findAll(admin);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it('scopes to the acting user\'s own institution for an INSTITUTION_ADMIN', async () => {
      const instAdmin = makeUser({ role: 'INSTITUTION_ADMIN', institutionId: 'inst-42' });
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.findAll(instAdmin);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { institutionId: 'inst-42' } }),
      );
    });

    it('scopes an INSTITUTION_ADMIN with no institution assigned to a sentinel value that matches nobody, rather than accidentally matching all other unassigned users', async () => {
      // This is the specific bug that was fixed: institutionId: null
      // would match every OTHER unassigned user, not correctly return
      // zero results. The sentinel value can never match a real
      // institutionId in the database.
      const instAdminNoInstitution = makeUser({ role: 'INSTITUTION_ADMIN', institutionId: null });
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.findAll(instAdminNoInstitution);

      const callArgs = prisma.user.findMany.mock.calls[0][0];
      expect(callArgs.where.institutionId).not.toBeNull();
      expect(callArgs.where.institutionId).not.toBe('inst-42');
    });
  });

  describe('adminUpdateUser', () => {
    it('allows a PLATFORM_ADMIN to update any field, including institutionId', async () => {
      const admin = makeUser({ role: 'PLATFORM_ADMIN' });
      const target = makeUser({ id: 'target-1' });
      prisma.user.findUnique.mockResolvedValue(target);
      prisma.user.update.mockResolvedValue(target);

      await service.adminUpdateUser('target-1', { institutionId: 'inst-99' }, admin);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'target-1' },
        data: { institutionId: 'inst-99' },
      });
    });

    it('allows an INSTITUTION_ADMIN to update role/isActive for a user in their own institution', async () => {
      const instAdmin = makeUser({ role: 'INSTITUTION_ADMIN', institutionId: 'inst-42' });
      const target = makeUser({ id: 'target-1', institutionId: 'inst-42' });
      prisma.user.findUnique.mockResolvedValue(target);
      prisma.user.update.mockResolvedValue(target);

      await service.adminUpdateUser(
        'target-1',
        { role: 'INSTITUTION_ADMIN', isActive: false },
        instAdmin,
      );

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'target-1' },
        data: { role: 'INSTITUTION_ADMIN', isActive: false },
      });
    });

    it('rejects an INSTITUTION_ADMIN attempting to update a user in a DIFFERENT institution', async () => {
      const instAdmin = makeUser({ role: 'INSTITUTION_ADMIN', institutionId: 'inst-42' });
      const target = makeUser({ id: 'target-1', institutionId: 'inst-99' });
      prisma.user.findUnique.mockResolvedValue(target);

      await expect(
        service.adminUpdateUser('target-1', { isActive: false }, instAdmin),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects an INSTITUTION_ADMIN with no institution assigned, even for a user with no institution', async () => {
      const instAdmin = makeUser({ role: 'INSTITUTION_ADMIN', institutionId: null });
      const target = makeUser({ id: 'target-1', institutionId: null });
      prisma.user.findUnique.mockResolvedValue(target);

      await expect(
        service.adminUpdateUser('target-1', { isActive: false }, instAdmin),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects an INSTITUTION_ADMIN attempting to change a user\'s institutionId, even within their own institution (privilege-escalation guard)', async () => {
      const instAdmin = makeUser({ role: 'INSTITUTION_ADMIN', institutionId: 'inst-42' });
      const target = makeUser({ id: 'target-1', institutionId: 'inst-42' });
      prisma.user.findUnique.mockResolvedValue(target);

      await expect(
        service.adminUpdateUser('target-1', { institutionId: 'inst-99' }, instAdmin),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the target user does not exist', async () => {
      const admin = makeUser({ role: 'PLATFORM_ADMIN' });
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.adminUpdateUser('nonexistent', { isActive: false }, admin),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects a plain EDUCATOR from updating any other user', async () => {
      const educator = makeUser({ role: 'EDUCATOR' });
      const target = makeUser({ id: 'target-1' });
      prisma.user.findUnique.mockResolvedValue(target);

      await expect(
        service.adminUpdateUser('target-1', { isActive: false }, educator),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});