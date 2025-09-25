import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  GameHistoryEntry,
  TournamentHistoryEntry,
  TransactionEntry,
  TournamentBracketResponse,
  HistoryQuery,
  Paginated,
} from '@shared/types';
import { TournamentBracketResponseSchema } from '@shared/types';
import {
  HistoryRepository,
  GAME_HISTORY_REPOSITORY,
  TOURNAMENT_BRACKET_REPOSITORY,
  TOURNAMENT_HISTORY_REPOSITORY,
  WALLET_HISTORY_REPOSITORY,
} from './history.repository';
import {
  GameHistory,
  TournamentBracket,
  TournamentHistory,
  WalletHistory,
} from './history.entity';

@Injectable()
export class HistoryService {
  private static readonly DEFAULT_CURRENCY = 'USD';
  private static readonly DEFAULT_LIMIT = 25;
  private static readonly MAX_LIMIT = 100;

  constructor(
    @Inject(GAME_HISTORY_REPOSITORY)
    private readonly games: HistoryRepository<GameHistory>,
    @Inject(TOURNAMENT_HISTORY_REPOSITORY)
    private readonly tournaments: HistoryRepository<TournamentHistory>,
    @Inject(WALLET_HISTORY_REPOSITORY)
    private readonly transactionsRepo: HistoryRepository<WalletHistory>,
    @Inject(TOURNAMENT_BRACKET_REPOSITORY)
    private readonly brackets: HistoryRepository<TournamentBracket>,
  ) {}

  async getGames(query: HistoryQuery): Promise<Paginated<GameHistoryEntry>> {
    const rows = await this.games.find();
    const config = this.normalizeQuery(query);
    const filtered = rows
      .filter((row) => {
        if (config.gameType && row.type.toLowerCase() !== config.gameType) {
          return false;
        }
        if (config.profitLoss === 'win' && !row.profit) {
          return false;
        }
        if (config.profitLoss === 'loss' && row.profit) {
          return false;
        }
        if (config.dateFrom && row.date < config.dateFrom) {
          return false;
        }
        if (config.dateTo && row.date > config.dateTo) {
          return false;
        }
        return true;
      })
      .sort((a, b) =>
        config.sort === 'asc'
          ? a.date.getTime() - b.date.getTime()
          : b.date.getTime() - a.date.getTime(),
      );

    const { slice, nextCursor } = this.sliceRows(filtered, config.offset, config.limit);
    const total = filtered.length;
    const items = slice.map((r) => ({
      id: r.id,
      type: r.type,
      stakes: r.stakes,
      buyin: r.buyin,
      date: r.date.toISOString(),
      profit: r.profit,
      ...this.parseAmount(r.amount),
    }));

    return { items, nextCursor, total };
  }

  async getTournaments(
    query: HistoryQuery,
  ): Promise<Paginated<TournamentHistoryEntry>> {
    const rows = await this.tournaments.find();
    const config = this.normalizeQuery(query);
    const sorted = rows
      .slice()
      .sort((a, b) =>
        config.sort === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name),
      );
    const { slice, nextCursor } = this.sliceRows(sorted, config.offset, config.limit);
    const total = sorted.length;
    const items = slice.map((r) => ({
      id: r.id,
      name: r.name,
      place: r.place,
      buyin: r.buyin,
      prize: r.prize,
      duration: r.duration,
    }));

    return { items, nextCursor, total };
  }

  async getTournamentBracket(
    tournamentId: string,
    userId: string,
  ): Promise<TournamentBracketResponse> {
    const bracket = await this.brackets.findOne({ where: { tournamentId } });
    if (!bracket) {
      throw new NotFoundException('Tournament bracket not found');
    }
    if (bracket.userId !== userId && userId !== 'admin') {
      throw new ForbiddenException();
    }
    return TournamentBracketResponseSchema.parse({
      tournamentId: bracket.tournamentId,
      rounds: Array.isArray(bracket.rounds) ? bracket.rounds : [],
    });
  }

  async getTransactions(
    query: HistoryQuery,
  ): Promise<Paginated<TransactionEntry>> {
    const rows = await this.transactionsRepo.find();
    const config = this.normalizeQuery(query);
    const filtered = rows
      .map((row) => ({
        row,
        amount: this.parseAmount(row.amount),
      }))
      .filter(({ row, amount }) => {
        if (config.gameType && row.type.toLowerCase() !== config.gameType) {
          return false;
        }
        if (config.profitLoss === 'win' && amount.amount <= 0) {
          return false;
        }
        if (config.profitLoss === 'loss' && amount.amount >= 0) {
          return false;
        }
        if (config.dateFrom && row.date < config.dateFrom) {
          return false;
        }
        if (config.dateTo && row.date > config.dateTo) {
          return false;
        }
        return true;
      })
      .sort((a, b) =>
        config.sort === 'asc'
          ? a.row.date.getTime() - b.row.date.getTime()
          : b.row.date.getTime() - a.row.date.getTime(),
      );

    const { slice, nextCursor } = this.sliceRows(
      filtered,
      config.offset,
      config.limit,
    );
    const total = filtered.length;
    const items = slice.map(({ row, amount }) => ({
      date: row.date.toISOString(),
      type: row.type,
      amount: amount.amount,
      currency: amount.currency,
      status: row.status,
    }));

    return { items, nextCursor, total };
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

  private normalizeQuery(query: HistoryQuery) {
    const limit = Math.min(
      query.limit ?? HistoryService.DEFAULT_LIMIT,
      HistoryService.MAX_LIMIT,
    );
    const offset = query.cursor ?? 0;
    const sort = query.sort === 'asc' ? 'asc' : 'desc';
    const dateFrom = this.parseDate(query.dateFrom);
    const dateTo = this.parseDate(query.dateTo);
    const gameType = query.gameType?.trim().toLowerCase() || undefined;
    const profitLoss = query.profitLoss;

    return { limit, offset, sort, dateFrom, dateTo, gameType, profitLoss };
  }

  private parseDate(value: string | undefined): Date | undefined {
    if (!value) {
      return undefined;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  private sliceRows<T>(rows: T[], offset: number, limit: number) {
    if (offset >= rows.length) {
      return { slice: [] as T[], nextCursor: null };
    }

    const slice = rows.slice(offset, offset + limit);
    const nextOffset = offset + slice.length;
    return {
      slice,
      nextCursor: nextOffset < rows.length ? String(nextOffset) : null,
    };
  }
}

