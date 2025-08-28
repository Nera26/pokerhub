import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
  constructor(
    @InjectRepository(Table) private readonly tables: Repository<Table>,
    private readonly tournamentService: TournamentService,
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
  ): Promise<boolean> {
    const tables = await this.tables.find({
      where: { tournament: { id: tournamentId } },
      relations: ['seats'],
    });
    if (tables.length === 0) return false;
    const counts = tables.map((t) => t.seats.length);
    const max = Math.max(...counts);
    const min = Math.min(...counts);
    if (max - min > 1) {
      await this.tournamentService.balanceTournament(
        tournamentId,
        currentHand,
        avoidWithin,
      );
      return true;
    }
    return false;
  }
}

export default TableBalancerService;
