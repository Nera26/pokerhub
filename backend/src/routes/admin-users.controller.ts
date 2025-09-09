import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { UsersService } from '../users/users.service';
import {
  DashboardUserListSchema,
  type DashboardUser,
  AdminUsersQuerySchema,
} from '@shared/types';

@ApiTags('admin')
@UseGuards(AuthGuard, AdminGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users' })
  @ApiResponse({ status: 200, description: 'Users list' })
  async list(@Req() req: Request): Promise<DashboardUser[]> {
    const { limit } = AdminUsersQuerySchema.parse(req.query);
    const res = await this.users.list(limit);
    return DashboardUserListSchema.parse(
      res.map((u) => ({
        id: u.id,
        username: u.username,
        avatarKey: u.avatarKey ?? undefined,
        balance: u.balance,
        banned: u.banned,
      })),
    );
  }
}
