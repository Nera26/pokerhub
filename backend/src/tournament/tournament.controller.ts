import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { TournamentService, PrizeOptions } from './tournament.service';

@Controller('tournaments')
export class TournamentController {
  constructor(private readonly service: TournamentService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Post('prizes')
  @HttpCode(200)
  calculatePrizes(
    @Body()
    body: {
      prizePool: number;
      payouts: number[];
      options?: PrizeOptions;
    },
  ) {
    return this.service.calculatePrizes(
      body.prizePool,
      body.payouts,
      body.options ?? {},
    );
  }
}
