import {
  Controller,
  Get,
  Post,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardRebuildQuerySchema } from '../schemas/leaderboard';
import type {
  LeaderboardEntry,
  LeaderboardRangesResponse,
  LeaderboardModesResponse,
} from '@shared/types';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@ApiTags('leaderboard')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get leaderboard' })
  @ApiResponse({ status: 200, description: 'Top players' })
  getLeaderboard(): Promise<LeaderboardEntry[]> {
    return this.leaderboardService.getTopPlayers();
  }

  @Post('rebuild')
  @UseGuards(AuthGuard, AdminGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Trigger leaderboard rebuild' })
  @ApiResponse({ status: 202, description: 'Rebuild started' })
  rebuild(@Query() query: unknown) {
    const { days } = LeaderboardRebuildQuerySchema.parse(query);
    void this.leaderboardService.rebuild({ days });
    return { status: 'ok' };
  }

  @Get('ranges')
  @ApiOperation({ summary: 'Get leaderboard time ranges' })
  @ApiResponse({ status: 200, description: 'Available time ranges' })
  getRanges(): LeaderboardRangesResponse {
    return this.leaderboardService.getRanges();
  }

  @Get('modes')
  @ApiOperation({ summary: 'Get leaderboard modes' })
  @ApiResponse({ status: 200, description: 'Available modes' })
  getModes(): LeaderboardModesResponse {
    return this.leaderboardService.getModes();
  }
}
