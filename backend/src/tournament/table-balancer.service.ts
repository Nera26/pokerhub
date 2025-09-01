import { Inject, Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type Redis from 'ioredis';
import { Repository } from 'typeorm';
import { Table } from '../database/entities/table.entity';
import { TournamentService } from './tournament.service';

/**
 * TableBalancerService monitors table sizes for a given tournament and
 * triggers a rebalance whenever the difference between the largest and
 * smallest table exceeds one player.
 */
@Injectable()
export class TableBalancerService {
  /**
   * Fallback store for `recentlyMoved` when Redis is unavailable. Maps
   * tournament id → map of player id → last moved hand.
   */
  private readonly localRecentlyMoved = new Map<
    string,
    Map<string, number>
  >();
  constructor(
    @InjectRepository(Table) private readonly tables: Repository<Table>,
    private readonly tournamentService: TournamentService,
    @Optional() @Inject('REDIS_CLIENT') private readonly redis?: Redis,
  ) {}

  /**
   * Rebalance tables if needed.
   *
   * @returns true if a rebalance was performed
   */
  async rebalanceIfNeeded(
    tournamentId: string,
    currentHand = 0,
    avoidWithin = 10,
    payoutThreshold?: number,
  ): Promise<boolean> {
    const tables = await this.tables.find({
      where: { tournament: { id: tournamentId } },
      relations: ['seats'],
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
      const key = `tourney:${tournamentId}:lastMoved`;
      let recentlyMoved = new Map<string, number>();
      if (this.redis) {
        const data = await this.redis.hgetall(key);
        recentlyMoved = new Map(
          Object.entries(data).map(([k, v]) => [k, Number(v)]),
        );
      } else {
        recentlyMoved =
          this.localRecentlyMoved.get(tournamentId) ?? new Map<string, number>();
      }

      for (const [playerId, last] of recentlyMoved) {
        if (currentHand - last > avoidWithin) {
          recentlyMoved.delete(playerId);
        }
      }

      await this.tournamentService.balanceTournament(
        tournamentId,
        currentHand,
        avoidWithin,
        recentlyMoved,
      );

      if (this.redis) {
        if (recentlyMoved.size === 0) {
          await this.redis.del(key);
        } else {
          await this.redis.hset(
            key,
            Object.fromEntries(
              Array.from(recentlyMoved.entries()).map(([k, v]) => [k, v.toString()]),
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
