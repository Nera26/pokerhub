import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { AdminTournamentSchema } from '../schemas/tournaments';

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
}
