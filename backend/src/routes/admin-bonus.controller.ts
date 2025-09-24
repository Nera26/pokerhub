import { Body, Delete, Get, HttpCode, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminController } from './admin-base.controller';
import { BonusService } from '../services/bonus.service';
import {
  BonusDefaultsResponse,
  BonusDefaultsResponseSchema,
  BonusOptionsResponse,
  BonusOptionsResponseSchema,
  BonusDefaultsRequest,
  BonusDefaultsRequestSchema,
  BonusStatsResponse,
  BonusStatsResponseSchema,
} from '../schemas/bonus';
import { MessageResponseSchema } from '../schemas/auth';

@AdminController('bonus')
export class AdminBonusController {
  constructor(private readonly bonusService: BonusService) {}

  @Get('options')
  @ApiOperation({ summary: 'Get bonus form options' })
  @ApiResponse({ status: 200, description: 'Bonus options' })
  options(): Promise<BonusOptionsResponse> {
    return this.bonusService
      .listOptions()
      .then((res) => BonusOptionsResponseSchema.parse(res));
  }

  @Get('defaults')
  @ApiOperation({ summary: 'Get bonus form defaults' })
  @ApiResponse({ status: 200, description: 'Bonus defaults' })
  defaults(): Promise<BonusDefaultsResponse> {
    return this.bonusService
      .getDefaults()
      .then((res) => BonusDefaultsResponseSchema.parse(res));
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get bonus statistics' })
  @ApiResponse({ status: 200, description: 'Bonus statistics' })
  stats(): Promise<BonusStatsResponse> {
    return this.bonusService
      .getStats()
      .then((res) => BonusStatsResponseSchema.parse(res));
  }

  @Post('defaults')
  @ApiOperation({ summary: 'Create bonus defaults' })
  @ApiResponse({ status: 201, description: 'Created defaults' })
  create(
    @Body() body: BonusDefaultsRequest,
  ): Promise<BonusDefaultsResponse> {
    const parsed = BonusDefaultsRequestSchema.parse(body);
    return this.bonusService
      .createDefaults(parsed)
      .then((res) => BonusDefaultsResponseSchema.parse(res));
  }

  @Put('defaults')
  @ApiOperation({ summary: 'Update bonus defaults' })
  @ApiResponse({ status: 200, description: 'Updated defaults' })
  update(
    @Body() body: BonusDefaultsRequest,
  ): Promise<BonusDefaultsResponse> {
    const parsed = BonusDefaultsRequestSchema.parse(body);
    return this.bonusService
      .updateDefaults(parsed)
      .then((res) => BonusDefaultsResponseSchema.parse(res));
  }

  @Delete('defaults')
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete bonus defaults' })
  @ApiResponse({ status: 200, description: 'Defaults deleted' })
  async remove() {
    await this.bonusService.deleteDefaults();
    return MessageResponseSchema.parse({ message: 'deleted' });
  }
}
