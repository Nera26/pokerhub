import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { UsersService } from '../users/users.service';
import {
  DashboardUserListSchema,
  DashboardUserSchema,
  type DashboardUser,
  AdminUsersQuerySchema,
  CreateUserSchema,
  type CreateUserRequest,
  UserMetaResponseSchema,
  type UserMetaResponse,
  ZodError,
} from '@shared/types';

@ApiTags('admin')
@UseGuards(AuthGuard, AdminGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly users: UsersService) {}

  @Get('meta')
  @ApiOperation({ summary: 'Get user metadata' })
  @ApiResponse({ status: 200, description: 'User roles and statuses' })
  meta(): UserMetaResponse {
    const res = {
      roles: [
        { value: 'Player', label: 'Player' },
        { value: 'Admin', label: 'Admin' },
      ],
      statuses: [
        { value: 'Active', label: 'Active' },
        { value: 'Frozen', label: 'Frozen' },
        { value: 'Banned', label: 'Banned' },
      ],
    };
    return UserMetaResponseSchema.parse(res);
  }

  @Post()
  @ApiOperation({ summary: 'Create user' })
  @ApiResponse({ status: 201, description: 'User created' })
  async create(@Body() body: CreateUserRequest): Promise<DashboardUser> {
    try {
      const parsed = CreateUserSchema.parse(body);
      const created = await this.users.create(parsed);
      return DashboardUserSchema.parse({
        id: created.id,
        username: created.username,
        avatarKey: created.avatarKey ?? undefined,
        balance: created.balance,
        banned: created.banned,
      });
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException(err.errors);
      }
      throw err;
    }
  }

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
