import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TournamentService } from './tournament.service';
import type {
  CalculatePrizesRequest,
  CalculatePrizesResponse,
} from '../schemas/tournament';

@Controller('tournaments')
export class TournamentController {
  constructor(private readonly service: TournamentService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Post(':id/register')
  register(@Param('id') id: string, @Body('userId') userId: string) {
    return this.service.register(id, userId);
  }

  @Post(':id/prizes')
  calculatePrizes(
    @Param('id') id: string,
    @Body() body: CalculatePrizesRequest,
  ): CalculatePrizesResponse {
    return this.service.calculatePrizes(body.prizePool, body.payouts, {
      bountyPct: body.bountyPct,
      satelliteSeatCost: body.satelliteSeatCost,
    });
  }
}
