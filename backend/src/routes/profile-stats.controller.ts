import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { UsersService } from '../users/users.service';
import {
  ProfileStatsResponseSchema,
  type ProfileStatsResponse,
} from '@shared/types';

@ApiTags('user')
@Controller('profile')
@UseGuards(AuthGuard)
export class ProfileStatsController {
  constructor(private readonly users: UsersService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get game statistics for current user' })
  @ApiResponse({ status: 200, description: 'Profile statistics' })
  async getStats(@Req() req: Request): Promise<ProfileStatsResponse> {
    const stats = await this.users.getStats(req.userId!);
    return ProfileStatsResponseSchema.parse(stats);
  }
}
