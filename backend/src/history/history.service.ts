import { Injectable } from '@nestjs/common';
import type {
  GameHistoryEntry,
  TournamentHistoryEntry,
  TransactionEntry,
} from '@shared/types';

@Injectable()
export class HistoryService {
  async getGames(): Promise<GameHistoryEntry[]> {
    return [];
  }

  async getTournaments(): Promise<TournamentHistoryEntry[]> {
    return [];
  }

  async getTransactions(): Promise<TransactionEntry[]> {
    return [];
  }
}

