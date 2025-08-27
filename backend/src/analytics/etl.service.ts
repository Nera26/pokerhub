import { Injectable, Logger } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Injectable()
export class EtlService {
  private readonly logger = new Logger(EtlService.name);

  constructor(private readonly analytics: AnalyticsService) {}

  async run() {
    this.logger.log('Running ETL pipeline');
    await this.loadCashLeaderboard();
    await this.loadMttLeaderboard();
  }

  private async loadCashLeaderboard() {
    await this.analytics.query(`
      CREATE TABLE IF NOT EXISTS leaderboard_cash (
        playerId String,
        amount Float64
      ) ENGINE = MergeTree ORDER BY playerId
    `);
    await this.analytics.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS mv_leaderboard_cash TO leaderboard_cash AS
      SELECT playerId, sum(amount) AS amount
      FROM cash_game_events
      GROUP BY playerId
    `);
  }

  private async loadMttLeaderboard() {
    await this.analytics.query(`
      CREATE TABLE IF NOT EXISTS leaderboard_mtt (
        playerId String,
        points Float64
      ) ENGINE = MergeTree ORDER BY playerId
    `);
    await this.analytics.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS mv_leaderboard_mtt TO leaderboard_mtt AS
      SELECT playerId, sum(points) AS points
      FROM tournament_events
      GROUP BY playerId
    `);
  }
}
