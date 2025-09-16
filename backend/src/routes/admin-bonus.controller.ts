import { Get } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminController } from './admin-base.controller';
import { BonusService } from '../services/bonus.service';
import {
  BonusDefaultsResponse,
  BonusDefaultsResponseSchema,
  BonusOptionsResponse,
  BonusOptionsResponseSchema,
} from '../schemas/bonus';

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
}
