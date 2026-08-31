// apps/api/src/modules/institutions/application/institutions.service.ts
//
// Platform-admin-only institution management. Institution assignment
// to individual users happens via UsersService.adminUpdateUser, not
// here -- this service only handles the institutions themselves.

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { Institution } from '../../../../generated/prisma/client';
import type { CreateInstitutionDto } from '../presentation/dto/create-institution.dto';

@Injectable()
export class InstitutionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateInstitutionDto): Promise<Institution> {
    return this.prisma.institution.create({ data: dto });
  }

  async findAll(): Promise<Institution[]> {
    return this.prisma.institution.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
