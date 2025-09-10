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
} from '../schemas/tournaments';
import { ZodError } from 'zod';
import { simulate, BlindLevel } from '../services/tournamentSimulator';

@ApiTags('admin')
@UseGuards(AuthGuard, AdminGuard)
@Controller('admin/tournaments')
export class AdminTournamentsController {
  @Get('defaults')
  @ApiOperation({ summary: 'Get default tournament values' })
  @ApiResponse({ status: 200, description: 'Default tournament values' })
  defaults() {
    return AdminTournamentSchema.parse({
      id: 0,
      name: '',
      gameType: "Texas Hold'em",
      buyin: 0,
      fee: 0,
      prizePool: 0,
      date: '',
      time: '',
      format: 'Regular',
      seatCap: '',
      description: '',
      rebuy: false,
      addon: false,
      status: 'scheduled',
    });
  }

  @Post('simulate')
  @HttpCode(200)
  @ApiOperation({ summary: 'Simulate tournament durations' })
  @ApiResponse({ status: 200, description: 'Simulation result' })
  simulate(@Body() body: unknown): TournamentSimulateResponse {
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
      return simulate(structure, entrants, runs);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException(err.errors);
      }
      throw err;
    }
  }
}
