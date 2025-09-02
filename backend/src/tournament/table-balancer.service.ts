import { Inject, Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  private readonly defaultAvoidWithin: number;
  constructor(
    @InjectRepository(Table) private readonly tables: Repository<Table>,
    private readonly tournamentService: TournamentService,
    @Optional() @Inject('REDIS_CLIENT') private readonly redis?: Redis,
    @Optional() private readonly config: ConfigService = new ConfigService(),
  ) {
    this.defaultAvoidWithin = this.config.get<number>(
      'tournament.avoidWithin',
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
      const recentlyMoved = new Map<string, number>();
      if (this.redis) {
        const key = `tourney:${tournamentId}:lastMoved`;
        const entries = await this.redis.hgetall(key);
        for (const [playerId, hand] of Object.entries(entries)) {
          const parsed = parseInt(hand, 10);
          if (!Number.isNaN(parsed)) {
            recentlyMoved.set(playerId, parsed);
          }
        }
      }
      for (const tbl of tables) {
        for (const seat of tbl.seats) {
          const last = seat.lastMovedHand ?? 0;
          if (currentHand > 0 && currentHand - last < avoidWithin) {
            const prev = recentlyMoved.get(seat.user.id) ?? -Infinity;
            if (last > prev) {
              recentlyMoved.set(seat.user.id, last);
            }
          }
        }
      }

      await this.tournamentService.balanceTournament(
        tournamentId,
        currentHand,
        avoidWithin,
        recentlyMoved,
      );

      return true;
    }
    return false;
  }
}

export default TableBalancerService;
