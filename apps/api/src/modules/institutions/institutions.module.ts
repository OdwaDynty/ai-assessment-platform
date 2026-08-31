// apps/api/src/modules/institutions/institutions.module.ts

import { Module } from '@nestjs/common';
import { InstitutionsController } from './presentation/institutions.controller';
import { InstitutionsService } from './application/institutions.service';

@Module({
  controllers: [InstitutionsController],
  providers: [InstitutionsService],
})
export class InstitutionsModule {}
