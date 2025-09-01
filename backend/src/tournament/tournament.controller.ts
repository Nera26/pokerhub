import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { RateLimitGuard } from '../routes/rate-limit.guard';
import { TournamentService } from './tournament.service';
import type {
  CalculatePrizesRequest,
  CalculatePrizesResponse,
  HotPatchLevelRequest,
  RegisterRequest,
  WithdrawRequest,
  TournamentScheduleRequest,
} from '../schemas/tournament';

@UseGuards(RateLimitGuard)
@Controller('tournaments')
export class TournamentController {
  constructor(private readonly service: TournamentService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Post(':id/register')
  register(@Param('id') id: string, @Body() body: RegisterRequest) {
    return this.service.register(id, body.userId);
  }

  @Post(':id/withdraw')
  @HttpCode(200)
  async withdraw(@Param('id') id: string, @Body() body: WithdrawRequest) {
    await this.service.withdraw(id, body.userId);
    return { message: 'tournament withdrawal' };
  }

  @Post(':id/cancel')
  @HttpCode(200)
  async cancel(@Param('id') id: string) {
    await this.service.cancel(id);
    return { message: 'tournament cancelled' };
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

  @Post(':id/levels/hot-patch')
  hotPatchLevel(
    @Param('id') id: string,
    @Body() body: HotPatchLevelRequest,
  ) {
    return this.service.hotPatchLevel(
      id,
      body.level,
      body.smallBlind,
      body.bigBlind,
    );
  }

  @Post(':id/schedule')
  @HttpCode(200)
  async schedule(
    @Param('id') id: string,
    @Body() body: TournamentScheduleRequest,
  ) {
    await this.service.scheduleTournament(id, {
      registration: {
        open: new Date(body.registration.open),
        close: new Date(body.registration.close),
      },
      structure: body.structure.map((s) => ({
        level: s.level,
        durationMinutes: s.durationMinutes,
      })),
      breaks: (body.breaks ?? []).map((b) => ({
        start: new Date(b.start),
        durationMs: b.durationMs,
      })),
      start: new Date(body.startTime),
    });
    return { message: 'tournament scheduled' };
  }
}
