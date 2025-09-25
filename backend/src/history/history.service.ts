import { Buffer } from 'node:buffer';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  GameHistoryPage,
  HistoryQuery,
  TournamentBracketResponse,
  TournamentHistoryPage,
  TransactionHistoryPage,
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
  private static readonly DEFAULT_LIMIT = 20;
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

  async getGames(query: HistoryQuery): Promise<GameHistoryPage> {
    const qb = this.games.createQueryBuilder('game');

    if (query.gameType) {
      qb.andWhere('game.type = :type', { type: query.gameType });
    }

    if (query.profitLoss === 'win') {
      qb.andWhere('game.profit = true');
    } else if (query.profitLoss === 'loss') {
      qb.andWhere('game.profit = false');
    }

    if (query.dateFrom) {
      qb.andWhere('game.date >= :dateFrom', { dateFrom: new Date(query.dateFrom) });
    }

    if (query.dateTo) {
      qb.andWhere('game.date <= :dateTo', { dateTo: new Date(query.dateTo) });
    }

    const limit = this.resolveLimit(query.limit);
    let total: number | undefined;

    if (!query.cursor) {
      total = await qb.clone().getCount();
    } else {
      const cursor = this.decodeDateCursor(query.cursor);
      qb.andWhere(
        '(game.date < :cursorDate OR (game.date = :cursorDate AND game.id < :cursorId))',
        { cursorDate: cursor.date.toISOString(), cursorId: cursor.id },
      );
    }

    const rows = await qb
      .orderBy('game.date', 'DESC')
      .addOrderBy('game.id', 'DESC')
      .take(limit + 1)
      .getMany();

    const hasMore = rows.length > limit;
    const slice = hasMore ? rows.slice(0, limit) : rows;
    const last = slice.at(-1);

    return {
      items: slice.map((r) => ({
        id: r.id,
        type: r.type,
        stakes: r.stakes,
        buyin: r.buyin,
        date: r.date.toISOString(),
        profit: r.profit,
        ...this.parseAmount(r.amount),
      })),
      nextCursor:
        hasMore && last ? this.encodeDateCursor(last.date, last.id) : undefined,
      total,
    };
  }

  async getTournaments(query: HistoryQuery): Promise<TournamentHistoryPage> {
    const qb = this.tournaments.createQueryBuilder('tournament');

    const limit = this.resolveLimit(query.limit);
    let total: number | undefined;

    if (!query.cursor) {
      total = await qb.clone().getCount();
    } else {
      const cursorId = this.decodeIdCursor(query.cursor);
      qb.andWhere('tournament.id < :cursorId', { cursorId });
    }

    const rows = await qb
      .orderBy('tournament.id', 'DESC')
      .take(limit + 1)
      .getMany();

    const hasMore = rows.length > limit;
    const slice = hasMore ? rows.slice(0, limit) : rows;
    const last = slice.at(-1);

    return {
      items: slice.map((r) => ({
        id: r.id,
        name: r.name,
        place: r.place,
        buyin: r.buyin,
        prize: r.prize,
        duration: r.duration,
      })),
      nextCursor: hasMore && last ? this.encodeIdCursor(last.id) : undefined,
      total,
    };
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

  async getTransactions(query: HistoryQuery): Promise<TransactionHistoryPage> {
    const qb = this.transactionsRepo.createQueryBuilder('wallet');

    if (query.dateFrom) {
      qb.andWhere('wallet.date >= :dateFrom', { dateFrom: new Date(query.dateFrom) });
    }

    if (query.dateTo) {
      qb.andWhere('wallet.date <= :dateTo', { dateTo: new Date(query.dateTo) });
    }

    if (query.gameType) {
      qb.andWhere('wallet.type = :type', { type: query.gameType });
    }

    if (query.profitLoss === 'win') {
      qb.andWhere("wallet.amount NOT LIKE '-%'");
    } else if (query.profitLoss === 'loss') {
      qb.andWhere("wallet.amount LIKE '-%'");
    }

    const limit = this.resolveLimit(query.limit);
    let total: number | undefined;

    if (!query.cursor) {
      total = await qb.clone().getCount();
    } else {
      const cursor = this.decodeDateCursor(query.cursor);
      qb.andWhere(
        '(wallet.date < :cursorDate OR (wallet.date = :cursorDate AND wallet.id < :cursorId))',
        { cursorDate: cursor.date.toISOString(), cursorId: cursor.id },
      );
    }

    const rows = await qb
      .orderBy('wallet.date', 'DESC')
      .addOrderBy('wallet.id', 'DESC')
      .take(limit + 1)
      .getMany();

    const hasMore = rows.length > limit;
    const slice = hasMore ? rows.slice(0, limit) : rows;
    const last = slice.at(-1);

    return {
      items: slice.map((r) => ({
        date: r.date.toISOString(),
        type: r.type,
        ...this.parseAmount(r.amount),
        status: r.status,
      })),
      nextCursor:
        hasMore && last ? this.encodeDateCursor(last.date, last.id) : undefined,
      total,
    };
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

  private resolveLimit(limit?: number): number {
    if (typeof limit === 'number' && Number.isFinite(limit)) {
      return Math.min(
        Math.max(Math.trunc(limit), 1),
        HistoryService.MAX_LIMIT,
      );
    }
    return HistoryService.DEFAULT_LIMIT;
  }

  private encodeDateCursor(date: Date, id: string): string {
    return Buffer.from(`${date.toISOString()}::${id}`, 'utf8').toString('base64');
  }

  private decodeDateCursor(cursor: string): { date: Date; id: string } {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf8');
      const [iso, id] = decoded.split('::');
      if (!iso || !id) {
        throw new Error('Invalid cursor');
      }
      const date = new Date(iso);
      if (Number.isNaN(date.getTime())) {
        throw new Error('Invalid cursor date');
      }
      return { date, id };
    } catch (error) {
      throw new BadRequestException('Invalid pagination cursor');
    }
  }

  private encodeIdCursor(id: string): string {
    return Buffer.from(id, 'utf8').toString('base64');
  }

  private decodeIdCursor(cursor: string): string {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf8');
      if (!decoded) {
        throw new Error('Invalid cursor');
      }
      return decoded;
    } catch (error) {
      throw new BadRequestException('Invalid pagination cursor');
    }
  }
}

