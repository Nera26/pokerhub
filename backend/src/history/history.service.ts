import { Inject, Injectable } from '@nestjs/common';
import type {
  GameHistoryEntry,
  TournamentHistoryEntry,
  TransactionEntry,
} from '@shared/types';
import {
  HistoryRepository,
  GAME_HISTORY_REPOSITORY,
  TOURNAMENT_HISTORY_REPOSITORY,
  WALLET_HISTORY_REPOSITORY,
} from './history.repository';
import { GameHistory, TournamentHistory, WalletHistory } from './history.entity';

@Injectable()
export class HistoryService {
  constructor(
    @Inject(GAME_HISTORY_REPOSITORY)
    private readonly games: HistoryRepository<GameHistory>,
    @Inject(TOURNAMENT_HISTORY_REPOSITORY)
    private readonly tournaments: HistoryRepository<TournamentHistory>,
    @Inject(WALLET_HISTORY_REPOSITORY)
    private readonly transactionsRepo: HistoryRepository<WalletHistory>,
  ) {}

  async getGames(): Promise<GameHistoryEntry[]> {
    const rows = await this.games.find();
    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      stakes: r.stakes,
      buyin: r.buyin,
      date: r.date.toISOString(),
      profit: r.profit,
      amount: r.amount,
    }));
  }

  async getTournaments(): Promise<TournamentHistoryEntry[]> {
    const rows = await this.tournaments.find();
    return rows.map((r) => ({
      name: r.name,
      place: r.place,
      buyin: r.buyin,
      prize: r.prize,
      duration: r.duration,
    }));
  }

  async getTransactions(): Promise<TransactionEntry[]> {
    const rows = await this.transactionsRepo.find();
    return rows.map((r) => ({
      date: r.date.toISOString(),
      type: r.type,
      amount: r.amount,
      status: r.status,
    }));
  }
}

