import {
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  PromotionSchema,
  PromotionsResponseSchema,
  MessageResponseSchema,
  type Promotion,
  type MessageResponse,
} from '@shared/types';
import type { Request } from 'express';

import { PromotionsService } from '../promotions/promotions.service';
import { AuthGuard } from '../auth/auth.guard';

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

  @Post(':id/claim')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Claim promotion' })
  @ApiResponse({ status: 200, description: 'Claim result' })
  async claimPromotion(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<MessageResponse> {
    const response = await this.promotions.claim(id, req.userId!);
    return MessageResponseSchema.parse(response);
  }
}
