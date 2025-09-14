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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RateLimitGuard } from '../routes/rate-limit.guard';
import { TournamentService } from './tournament.service';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import type {
  CalculatePrizesRequest,
  CalculatePrizesResponse,
  HotPatchLevelRequest,
  TournamentScheduleRequest,
} from '@shared/types';
import type { Request } from 'express';
import { TournamentFiltersResponseSchema } from '@shared/types';
import { BotProfilesResponseSchema } from '@shared/types';

@UseGuards(RateLimitGuard)
@ApiTags('tournaments')
@Controller('tournaments')
export class TournamentController {
  constructor(private readonly service: TournamentService) {}

  @Get()
  @ApiOperation({ summary: 'List tournaments' })
  @ApiResponse({ status: 200, description: 'Tournament list' })
  list() {
    return this.service.list();
  }

  @Get('bot-profiles')
  @ApiOperation({ summary: 'List bot profiles' })
  @ApiResponse({ status: 200, description: 'Bot profiles' })
  async botProfiles() {
    const res = await this.service.getBotProfiles();
    return BotProfilesResponseSchema.parse(res);
  }

  @Get('filters')
  @ApiOperation({ summary: 'Get tournament filter options' })
  @ApiResponse({ status: 200, description: 'Filter options' })
  async filters() {
    const res = await this.service.getFilterOptions();
    return TournamentFiltersResponseSchema.parse(res);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tournament by id' })
  @ApiResponse({ status: 200, description: 'Tournament details' })
  get(@Param('id') id: string, @Req() req: Request) {
    return this.service.get(id, req.userId);
  }

  @Post(':id/register')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Register for tournament' })
  @ApiResponse({ status: 200, description: 'Registration accepted' })
  register(@Param('id') id: string, @Req() req: Request) {
    return this.service.join(id, req.userId);
  }

  @Post(':id/withdraw')
  @UseGuards(AuthGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Withdraw from tournament' })
  @ApiResponse({ status: 200, description: 'Withdrawn from tournament' })
  async withdraw(@Param('id') id: string, @Req() req: Request) {
    await this.service.withdraw(id, req.userId);
    return { message: 'tournament withdrawal' };
  }

  @Post(':id/cancel')
  @UseGuards(AuthGuard, AdminGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Cancel tournament' })
  @ApiResponse({ status: 200, description: 'Tournament cancelled' })
  async cancel(@Param('id') id: string) {
    await this.service.cancel(id);
    return { message: 'tournament cancelled' };
  }

  @Post(':id/prizes')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Calculate prize distribution' })
  @ApiResponse({ status: 200, description: 'Prize calculation result' })
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
  @UseGuards(AuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Hot patch tournament level' })
  @ApiResponse({ status: 200, description: 'Level patched' })
  hotPatchLevel(@Param('id') id: string, @Body() body: HotPatchLevelRequest) {
    return this.service.hotPatchLevel(
      id,
      body.level,
      body.smallBlind,
      body.bigBlind,
    );
  }

  @Post(':id/schedule')
  @UseGuards(AuthGuard, AdminGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Schedule tournament' })
  @ApiResponse({ status: 200, description: 'Tournament scheduled' })
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
