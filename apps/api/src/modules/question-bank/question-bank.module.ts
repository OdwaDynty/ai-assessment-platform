// apps/api/src/modules/question-bank/question-bank.module.ts
//
// Registers the Question Bank feature module.

import { Module } from '@nestjs/common';
import { QuestionBankController } from './presentation/question-bank.controller';
import { QuestionBankService } from './application/question-bank.service';

@Module({
  controllers: [QuestionBankController],
  providers: [QuestionBankService],
})
export class QuestionBankModule {}
