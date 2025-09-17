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
  private static readonly DEFAULT_CURRENCY = 'USD';

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
      ...this.parseAmount(r.amount),
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
      ...this.parseAmount(r.amount),
      status: r.status,
    }));
  }

  private parseAmount(amount: string | null | undefined): {
    amount: number;
    currency: string;
  } {
    if (!amount) {
      return { amount: 0, currency: HistoryService.DEFAULT_CURRENCY };
    }

    const trimmed = amount.trim();
    const currencyMatch = trimmed.match(/([A-Za-z]{3})$/);
    const symbolMatch = trimmed.match(/([$€£])/);
    const symbolCurrency = symbolMatch
      ? { $: 'USD', '€': 'EUR', '£': 'GBP' }[symbolMatch[1]]
      : undefined;
    const currency = (currencyMatch
      ? currencyMatch[1].toUpperCase()
      : symbolCurrency) ?? HistoryService.DEFAULT_CURRENCY;

    const numericPart = trimmed.replace(/[^0-9.+-]/g, '');
    const parsed = Number.parseFloat(numericPart);

    return {
      amount: Number.isFinite(parsed) ? parsed : 0,
      currency,
    };
  }
}

