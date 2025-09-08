import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  PromotionSchema,
  PromotionsResponseSchema,
  type Promotion,
} from '@shared/types';

import { PromotionsService } from '../promotions/promotions.service';

@ApiTags('promotions')
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotions: PromotionsService) {}

  @Get()
  @ApiOperation({ summary: 'List promotions' })
  @ApiResponse({ status: 200, description: 'Promotions list' })
  async getPromotions(): Promise<Promotion[]> {
    const promos = await this.promotions.findAll();
    return PromotionsResponseSchema.parse(promos);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get promotion by id' })
  @ApiResponse({ status: 200, description: 'Promotion detail' })
  async getPromotion(@Param('id') id: string): Promise<Promotion> {
    const promo = await this.promotions.findOne(id);
    if (!promo) {
      throw new NotFoundException('Promotion not found');
    }
    return PromotionSchema.parse(promo);
  }
}
