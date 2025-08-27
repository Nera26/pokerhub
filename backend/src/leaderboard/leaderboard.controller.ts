import { Controller, Get, Post, Query } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  getLeaderboard() {
    return this.leaderboardService.getTopPlayers();
  }

  @Post('rebuild')
  rebuild(@Query('days') days?: string) {
    const d = days ? Number.parseInt(days, 10) : 30;
    void this.leaderboardService.rebuild(d);
    return { message: 'rebuild started' };
  }
}
