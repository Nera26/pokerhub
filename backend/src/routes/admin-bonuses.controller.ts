import { Body, Delete, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminController } from './admin-base.controller';
import { BonusService } from '../services/bonus.service';
import {
  BonusSchema,
  type Bonus,
  BonusesResponseSchema,
  type BonusesResponse,
  BonusCreateRequestSchema,
  type BonusCreateRequest,
  BonusUpdateRequestSchema,
  type BonusUpdateRequest,
} from '../schemas/bonus';
import { MessageResponseSchema } from '../schemas/auth';

@AdminController('bonuses')
export class AdminBonusesController {
  constructor(private readonly bonusService: BonusService) {}

  @Get()
  @ApiOperation({ summary: 'List bonuses' })
  @ApiResponse({ status: 200, description: 'Bonuses list' })
  async list(): Promise<BonusesResponse> {
    const bonuses = await this.bonusService.list();
    return BonusesResponseSchema.parse(bonuses);
  }

  @Post()
  @ApiOperation({ summary: 'Create bonus' })
  @ApiResponse({ status: 201, description: 'Created bonus' })
  async create(@Body() body: BonusCreateRequest): Promise<Bonus> {
    const parsed = BonusCreateRequestSchema.parse(body);
    const bonus = await this.bonusService.create(parsed);
    return BonusSchema.parse(bonus);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update bonus' })
  @ApiResponse({ status: 200, description: 'Updated bonus' })
  @ApiResponse({ status: 404, description: 'Bonus not found' })
  async update(
    @Param('id') id: string,
    @Body() body: BonusUpdateRequest,
  ): Promise<Bonus> {
    const parsed = BonusUpdateRequestSchema.parse(body);
    const bonus = await this.bonusService.update(Number(id), parsed);
    return BonusSchema.parse(bonus);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Delete bonus' })
  @ApiResponse({ status: 200, description: 'Bonus deleted' })
  async remove(@Param('id') id: string) {
    await this.bonusService.remove(Number(id));
    return MessageResponseSchema.parse({ message: 'deleted' });
  }
}
