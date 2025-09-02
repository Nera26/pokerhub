import {
  Controller,
  Get,
  Post,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardRebuildQuerySchema } from '../schemas/leaderboard';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  getLeaderboard() {
    return this.leaderboardService.getTopPlayers();
  }

  @Post('rebuild')
  @UseGuards(AuthGuard, AdminGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  rebuild(@Query() query: unknown) {
    const { days } = LeaderboardRebuildQuerySchema.parse(query);
    void this.leaderboardService.rebuild({ days });
    return { status: 'ok' };
  }
}
