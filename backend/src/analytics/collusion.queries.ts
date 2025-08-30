import { Injectable } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Injectable()
export class CollusionQueryService {
  constructor(private readonly analytics: AnalyticsService) {}

  async sharedIpFlags() {
    const sql = `SELECT ip, array_agg(player_id) AS players
FROM session_logs
GROUP BY ip
HAVING COUNT(DISTINCT player_id) > 1`;
    return this.analytics.select(sql);
  }

  async chipDumpingFlags() {
    const sql = `SELECT from_player, to_player, SUM(amount) AS total_transferred
FROM chip_transfers
GROUP BY from_player, to_player
HAVING total_transferred > 100000`;
    return this.analytics.select(sql);
  }

  async synchronizedBetFlags() {
    const sql = `SELECT hand_id, array_agg(player_id) AS actors
FROM betting_events
GROUP BY hand_id
HAVING stddev(action_time_ms) < 200`;
    return this.analytics.select(sql);
  }
}
