import { Inject, Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import type Redis from 'ioredis';
import { Repository } from 'typeorm';
import { Table } from '../database/entities/table.entity';
import { DEFAULT_AVOID_WITHIN } from '../config/tournament.config';
import { TournamentService } from './tournament.service';

/**
 * TableBalancerService monitors table sizes for a given tournament and
 * triggers a rebalance whenever the difference between the largest and
 * smallest table exceeds one player.
 */
@Injectable()
export class TableBalancerService {
  private readonly defaultAvoidWithin: number;
  private localRecentlyMoved = new Map<string, Map<string, number>>();
  constructor(
    @InjectRepository(Table) private readonly tables: Repository<Table>,
    private readonly tournamentService: TournamentService,
    @Optional() @Inject('REDIS_CLIENT') private readonly redis?: Redis,
    @Optional() private readonly config: ConfigService = new ConfigService(),
  ) {
    this.defaultAvoidWithin =
      this.config.get<number>('tournament.avoidWithin') ??
      parseInt(
        process.env.TOURNAMENT_AVOID_WITHIN ??
          DEFAULT_AVOID_WITHIN.toString(),
        10,
      );
  }

  /**
   * Rebalance tables if needed.
   *
   * @returns true if a rebalance was performed
   */
  async rebalanceIfNeeded(
    tournamentId: string,
    currentHand = 0,
    avoidWithin?: number,
    payoutThreshold?: number,
  ): Promise<boolean> {
    avoidWithin = avoidWithin ?? this.defaultAvoidWithin;
    const tables = await this.tables.find({
      where: { tournament: { id: tournamentId } },
      relations: ['seats', 'seats.user'],
    });
    if (tables.length === 0) return false;
    const counts = tables.map((t) => t.seats.length);
    if (payoutThreshold !== undefined) {
      const remaining = counts.reduce((a, b) => a + b, 0);
      await this.tournamentService.detectBubble(
        tournamentId,
        remaining,
        payoutThreshold,
      );
    }
    const max = Math.max(...counts);
    const min = Math.min(...counts);
    if (max - min > 1) {
      let recentlyMoved: Map<string, number>;
      if (this.redis) {
        recentlyMoved = new Map();
        const key = `tourney:${tournamentId}:lastMoved`;
        const entries = await this.redis.hgetall(key);
        for (const [playerId, hand] of Object.entries(entries)) {
          const parsed = parseInt(hand, 10);
          if (!Number.isNaN(parsed)) {
            recentlyMoved.set(playerId, parsed);
          }
        }
      } else {
        recentlyMoved =
          this.localRecentlyMoved.get(tournamentId) ?? new Map<string, number>();
      }

      const updated = new Map<string, number>();
      for (const tbl of tables) {
        for (const seat of tbl.seats) {
          if (seat.lastMovedHand) {
            updated.set(seat.user.id, seat.lastMovedHand);
          }
        }
      }
      recentlyMoved = updated;

      await this.tournamentService.balanceTournament(
        tournamentId,
        currentHand,
        avoidWithin,
        recentlyMoved,
      );
      if (this.redis) {
        const key = `tourney:${tournamentId}:lastMoved`;
        if (recentlyMoved.size === 0) {
          await this.redis.del(key);
        } else {
          await this.redis.hset(
            key,
            Object.fromEntries(
              Array.from(recentlyMoved.entries()).map(([k, v]) => [
                k,
                v.toString(),
              ]),
            ),
          );
        }
      } else {
        this.localRecentlyMoved.set(tournamentId, recentlyMoved);
      }

      return true;
    }
    return false;
  }
}

export default TableBalancerService;
