import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RateLimitGuard } from '../routes/rate-limit.guard';
import { TournamentService } from './tournament.service';
import { AuthGuard } from '../auth/auth.guard';
import type {
  CalculatePrizesRequest,
  CalculatePrizesResponse,
  HotPatchLevelRequest,
  TournamentScheduleRequest,
} from '../schemas/tournament';
import type { Request } from 'express';

@UseGuards(RateLimitGuard)
@Controller('tournaments')
export class TournamentController {
  constructor(private readonly service: TournamentService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post(':id/register')
  @UseGuards(AuthGuard)
  register(@Param('id') id: string, @Req() req: Request) {
    return this.service.register(id, req.userId);
  }

  @Post(':id/withdraw')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  async withdraw(@Param('id') id: string, @Req() req: Request) {
    await this.service.withdraw(id, req.userId);
    return { message: 'tournament withdrawal' };
  }

  @Post(':id/cancel')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  async cancel(@Param('id') id: string) {
    await this.service.cancel(id);
    return { message: 'tournament cancelled' };
  }

  @Post(':id/prizes')
  @UseGuards(AuthGuard)
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
  @UseGuards(AuthGuard)
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
  @UseGuards(AuthGuard)
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
