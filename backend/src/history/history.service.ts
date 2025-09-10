import { Injectable } from '@nestjs/common';
import type {
  GameHistoryEntry,
  TournamentHistoryEntry,
  TransactionEntry,
} from '@shared/types';
import {
  GameHistoryRepository,
  TournamentHistoryRepository,
  WalletHistoryRepository,
} from './history.repository';

@Injectable()
export class HistoryService {
  constructor(
    private readonly games: GameHistoryRepository,
    private readonly tournaments: TournamentHistoryRepository,
    private readonly transactionsRepo: WalletHistoryRepository,
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

