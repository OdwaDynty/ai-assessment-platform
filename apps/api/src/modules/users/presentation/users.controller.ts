import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { UsersService } from '../application/users.service';
import {
  updateProfileSchema,
  type UpdateProfileDto,
} from './dto/update-profile.dto';
import {
  adminUpdateUserSchema,
  type AdminUpdateUserDto,
} from './dto/admin-update-user.dto';
import type { User } from '../../../../generated/prisma/client';

@Controller('users')
@UseGuards(SupabaseAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: User): User {
    return user;
  }

  @Patch('me')
  updateMe(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(updateProfileSchema)) dto: UpdateProfileDto,
  ): Promise<User> {
    return this.usersService.updateOwnProfile(user.id, dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('PLATFORM_ADMIN', 'INSTITUTION_ADMIN')
  findAll(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.usersService.findAll(
      page ? parseInt(page, 10) : undefined,
      pageSize ? parseInt(pageSize, 10) : undefined,
    );
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('PLATFORM_ADMIN')
  adminUpdate(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adminUpdateUserSchema)) dto: AdminUpdateUserDto,
    @CurrentUser() actingUser: User,
  ): Promise<User> {
    return this.usersService.adminUpdateUser(id, dto, actingUser);
  }
}
