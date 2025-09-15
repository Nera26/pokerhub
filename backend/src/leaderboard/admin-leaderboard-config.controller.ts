import { Body, Delete, Get, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminController } from '../routes/admin-base.controller';
import { LeaderboardConfigService } from './leaderboard-config.service';
import {
  LeaderboardConfigSchema,
  LeaderboardConfigListResponseSchema,
  LeaderboardConfigUpdateSchema,
  type LeaderboardConfig,
  type LeaderboardConfigListResponse,
  type LeaderboardConfigUpdate,
} from '../schemas/leaderboard';

@AdminController('leaderboard-config')
export class AdminLeaderboardConfigController {
  constructor(private readonly service: LeaderboardConfigService) {}

  @Get()
  @ApiOperation({ summary: 'List leaderboard config' })
  @ApiResponse({ status: 200, description: 'Config entries' })
  async list(): Promise<LeaderboardConfigListResponse> {
    const configs = await this.service.list();
    return LeaderboardConfigListResponseSchema.parse({ configs });
  }

  @Post()
  @ApiOperation({ summary: 'Create leaderboard config entry' })
  @ApiResponse({ status: 200, description: 'Updated config entries' })
  async create(@Body() body: unknown): Promise<LeaderboardConfigListResponse> {
    const entry = LeaderboardConfigSchema.parse(body);
    await this.service.create(entry);
    const configs = await this.service.list();
    return LeaderboardConfigListResponseSchema.parse({ configs });
  }

  @Put()
  @ApiOperation({ summary: 'Update leaderboard config entry' })
  @ApiResponse({ status: 200, description: 'Updated config entries' })
  async update(@Body() body: unknown): Promise<LeaderboardConfigListResponse> {
    const payload = LeaderboardConfigUpdateSchema.parse(body);
    const { range, mode, newRange, newMode } = payload;
    await this.service.update({ range, mode }, { range: newRange, mode: newMode });
    const configs = await this.service.list();
    return LeaderboardConfigListResponseSchema.parse({ configs });
  }

  @Delete()
  @ApiOperation({ summary: 'Delete leaderboard config entry' })
  @ApiResponse({ status: 200, description: 'Updated config entries' })
  async remove(@Body() body: unknown): Promise<LeaderboardConfigListResponse> {
    const entry = LeaderboardConfigSchema.parse(body);
    await this.service.remove(entry);
    const configs = await this.service.list();
    return LeaderboardConfigListResponseSchema.parse({ configs });
  }
}
