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

  async findAll(page = 1, pageSize = 20): Promise<PaginatedUsers> {
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return { data, total, page, pageSize };
  }

  async adminUpdateUser(
    targetUserId: string,
    dto: AdminUpdateUserDto,
    actingUser: User,
  ): Promise<User> {
    if (actingUser.role !== 'PLATFORM_ADMIN') {
      throw new ForbiddenException('Only platform admins can update other users');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!target) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: dto,
    });
  }
}
