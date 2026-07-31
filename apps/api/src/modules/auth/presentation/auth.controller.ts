import { Controller, Get, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { User } from '../../../../generated/prisma/client';

@Controller('auth')
export class AuthController {
  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  getMe(@CurrentUser() user: User): User {
    return user;
  }
}
