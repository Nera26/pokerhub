import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  BadRequestException,
  HttpCode,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import {
  AdminTournamentSchema,
  TournamentSimulateRequestSchema,
  TournamentSimulateResponse,
  TournamentFormatsResponseSchema,
} from '../schemas/tournaments';
import { ZodError } from 'zod';
import { simulate, type BlindLevel } from '@shared/utils/tournamentSimulator';
import { BotProfilesResponseSchema } from '@shared/types';
import { TournamentService } from '../tournament/tournament.service';

@ApiTags('admin')
@UseGuards(AuthGuard, AdminGuard)
@Controller('admin/tournaments')
export class AdminTournamentsController {
  constructor(private readonly service: TournamentService) {}
  @Get('formats')
  @ApiOperation({ summary: 'List tournament formats' })
  @ApiResponse({
    status: 200,
    description: 'Available tournament formats',
  })
  async formats() {
    const formats = await this.service.listFormats();
    return TournamentFormatsResponseSchema.parse(formats);
  }

  @Get('defaults')
  @ApiOperation({ summary: 'Get default tournament values' })
  @ApiResponse({ status: 200, description: 'Default tournament values' })
  async defaults() {
    const defaults = await this.service.getDefaultTournament();
    return AdminTournamentSchema.parse(defaults);
  }

  @Post('simulate')
  @HttpCode(200)
  @ApiOperation({ summary: 'Simulate tournament durations' })
  @ApiResponse({ status: 200, description: 'Simulation result' })
  async simulate(@Body() body: unknown): Promise<TournamentSimulateResponse> {
    try {
      const { levels, levelMinutes, increment, entrants, runs } =
        TournamentSimulateRequestSchema.parse(body);
      const structure: BlindLevel[] = Array.from(
        { length: levels },
        (_, i) => ({
          level: i + 1,
          durationMinutes: levelMinutes,
          blindMultiplier: 1 + i * increment,
        }),
      );
      const profiles = await this.service.getBotProfiles();
      const parsed = BotProfilesResponseSchema.parse(profiles);
      return simulate(structure, entrants, runs, parsed);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException(err.errors);
      }
      throw err;
    }
  }
}
