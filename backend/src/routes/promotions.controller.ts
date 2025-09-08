import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PromotionSchema, type Promotion } from '@shared/types';

@ApiTags('promotions')
@Controller('promotions')
export class PromotionsController {
  @Get(':id')
  @ApiOperation({ summary: 'Get promotion by id' })
  @ApiResponse({ status: 200, description: 'Promotion detail' })
  getPromotion(@Param('id') id: string): Promotion {
    return PromotionSchema.parse({
      id,
      category: 'daily',
      title: 'Cash Game Challenge',
      description: 'Wager on cash games to earn rewards.',
      reward: '$50 Bonus',
      breakdown: [
        { label: 'Cashed hands', value: 200 },
        { label: 'Showdown wins', value: 150 },
      ],
      eta: '~2 hours of average play',
      progress: {
        current: 200,
        total: 500,
        label: '200 / 500',
        barColorClass: 'bg-accent-green',
      },
    });
  }
}
