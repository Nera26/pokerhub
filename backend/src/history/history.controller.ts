import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import {
  GameHistoryEntrySchema,
  TournamentHistoryEntrySchema,
  TransactionEntrySchema,
  type GameHistoryEntry,
  type TournamentHistoryEntry,
  type TransactionEntry,
} from '@shared/types';
import { AuthGuard } from '../auth/auth.guard';
import { HistoryService } from './history.service';

@ApiTags('history')
@Controller('history')
@UseGuards(AuthGuard)
export class HistoryController {
  constructor(private readonly history: HistoryService) {}

  @Get('games')
  @ApiOperation({ summary: 'List game history' })
  @ApiResponse({ status: 200, description: 'Game history entries' })
  async games(): Promise<GameHistoryEntry[]> {
    const res = await this.history.getGames();
    return z.array(GameHistoryEntrySchema).parse(res);
  }

  @Get('tournaments')
  @ApiOperation({ summary: 'List tournament history' })
  @ApiResponse({
    status: 200,
    description: 'Tournament history entries',
  })
  async tournaments(): Promise<TournamentHistoryEntry[]> {
    const res = await this.history.getTournaments();
    return z.array(TournamentHistoryEntrySchema).parse(res);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'List wallet transactions' })
  @ApiResponse({
    status: 200,
    description: 'Transaction history entries',
  })
  async transactions(): Promise<TransactionEntry[]> {
    const res = await this.history.getTransactions();
    return z.array(TransactionEntrySchema).parse(res);
  }
}

