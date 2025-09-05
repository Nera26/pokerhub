import { Injectable } from '@nestjs/common';
import { AnalyticsService } from '../analytics.service';

interface SharedIpRow {
  ip: string;
  players: string[];
}

interface ChipDumpRow {
  from_player: string;
  to_player: string;
  total_transferred: number;
}

interface SyncBetRow {
  hand_id: string;
  actors: string[];
}

interface LatencyCorrRow {
  player_a: string;
  player_b: string;
  latency_corr: number;
}

@Injectable()
export class CollusionQueryService {
  constructor(private readonly analytics: AnalyticsService) {}

  private async persist(
    kind: string,
    payload: Record<string, any>,
    users: string[],
  ) {
    await this.analytics.ingest('collusion_alerts', {
      kind,
      ...payload,
      created_at: Date.now(),
    });
    await this.analytics.emitAntiCheatFlag({
      sessionId:
        (payload as any).hand_id ??
        (payload as any).ip ??
        `${(payload as any).from_player}-${(payload as any).to_player}`,
      users,
      features: { kind, ...payload },
    });
  }

  async sharedIpFlags() {
    const sql = `SELECT ip, array_agg(player_id) AS players
FROM session_logs
GROUP BY ip
HAVING COUNT(DISTINCT player_id) > 1`;
    const rows = await this.analytics.select<SharedIpRow>(sql);
    for (const row of rows) {
      await this.persist('shared_ip', row, row.players);
    }
    return rows;
  }

  async chipDumpingFlags() {
    const sql = `SELECT from_player, to_player, SUM(amount) AS total_transferred
FROM chip_transfers
GROUP BY from_player, to_player
HAVING total_transferred > 100000`;
    const rows = await this.analytics.select<ChipDumpRow>(sql);
    for (const row of rows) {
      await this.persist(
        'chip_dumping',
        row,
        [row.from_player, row.to_player],
      );
    }
    return rows;
  }

  async synchronizedBetFlags() {
    const sql = `SELECT hand_id, array_agg(player_id) AS actors
FROM betting_events
GROUP BY hand_id
HAVING stddev(action_time_ms) < 200`;
    const rows = await this.analytics.select<SyncBetRow>(sql);
    for (const row of rows) {
      await this.persist('synchronized_bets', row, row.actors);
    }
    return rows;
  }

  async latencyCorrelationFlags() {
    const sql = `SELECT a.player_id AS player_a, b.player_id AS player_b,\n            corr(a.action_time_ms, b.action_time_ms) AS latency_corr\nFROM betting_events a\nJOIN betting_events b ON a.hand_id = b.hand_id AND a.player_id < b.player_id\nGROUP BY player_a, player_b\nHAVING COUNT(*) >= 20 AND corr(a.action_time_ms, b.action_time_ms) > 0.95`;
    const rows = await this.analytics.select<LatencyCorrRow>(sql);
    for (const row of rows) {
      await this.persist('latency_correlation', row, [
        row.player_a,
        row.player_b,
      ]);
    }
    return rows;
  }
}
