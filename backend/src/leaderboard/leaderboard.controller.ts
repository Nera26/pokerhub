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
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@ApiTags('leaderboard')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get leaderboard' })
  @ApiResponse({ status: 200, description: 'Top players' })
  getLeaderboard() {
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
}
