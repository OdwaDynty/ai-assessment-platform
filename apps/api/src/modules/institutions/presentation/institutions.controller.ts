// apps/api/src/modules/institutions/presentation/institutions.controller.ts
//
// PLATFORM_ADMIN-only institution management endpoints.

import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { InstitutionsService } from '../application/institutions.service';
import {
  createInstitutionSchema,
  type CreateInstitutionDto,
} from './dto/create-institution.dto';

@Controller('institutions')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('PLATFORM_ADMIN')
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(createInstitutionSchema)) dto: CreateInstitutionDto,
  ) {
    return this.institutionsService.create(dto);
  }

  @Get()
  findAll() {
    return this.institutionsService.findAll();
  }
}
