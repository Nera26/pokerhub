import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  PromotionSchema,
  PromotionsResponseSchema,
  type Promotion,
} from '@shared/types';

const promotions: Promotion[] = [
  {
    id: '1',
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
  },
  {
    id: '2',
    category: 'weekly',
    title: 'Tournament Master',
    description: 'Play tournaments to earn rewards.',
    reward: '$100 Bonus',
    unlockText: 'Play 5 tournaments',
    breakdown: [{ label: 'Tournaments Played', value: 2 }],
  },
];

@ApiTags('promotions')
@Controller('promotions')
export class PromotionsController {
  @Get()
  @ApiOperation({ summary: 'List promotions' })
  @ApiResponse({ status: 200, description: 'Promotions list' })
  getPromotions(): Promotion[] {
    return PromotionsResponseSchema.parse(promotions);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get promotion by id' })
  @ApiResponse({ status: 200, description: 'Promotion detail' })
  getPromotion(@Param('id') id: string): Promotion {
    const promo = promotions.find((p) => p.id === id) ?? promotions[0];
    return PromotionSchema.parse(promo);
  }
}
