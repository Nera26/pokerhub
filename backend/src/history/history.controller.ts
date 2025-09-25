import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  GameHistoryEntrySchema,
  TournamentHistoryEntrySchema,
  TransactionEntrySchema,
  TournamentBracketResponseSchema,
  type GameHistoryEntry,
  HistoryQuerySchema,
  PaginatedResponseSchema,
  type Paginated,
  type TournamentHistoryEntry,
  type TransactionEntry,
  type TournamentBracketResponse,
} from '@shared/types';
import { AuthGuard } from '../auth/auth.guard';
import { HistoryService } from './history.service';
import type { Request } from 'express';

@ApiTags('history')
@Controller('history')
@UseGuards(AuthGuard)
export class HistoryController {
  constructor(private readonly history: HistoryService) {}

  @Get('games')
  @ApiOperation({ summary: 'List game history' })
  @ApiResponse({ status: 200, description: 'Game history entries' })
  async games(@Query() query: unknown): Promise<Paginated<GameHistoryEntry>> {
    const parsed = HistoryQuerySchema.parse(query ?? {});
    const res = await this.history.getGames(parsed);
    return PaginatedResponseSchema(GameHistoryEntrySchema).parse(res);
  }

  @Get('tournaments')
  @ApiOperation({ summary: 'List tournament history' })
  @ApiResponse({
    status: 200,
    description: 'Tournament history entries',
  })
  async tournaments(
    @Query() query: unknown,
  ): Promise<Paginated<TournamentHistoryEntry>> {
    const parsed = HistoryQuerySchema.parse(query ?? {});
    const res = await this.history.getTournaments(parsed);
    return PaginatedResponseSchema(TournamentHistoryEntrySchema).parse(res);
  }

  @Get('tournaments/:id/bracket')
  @ApiOperation({ summary: 'Get tournament bracket' })
  @ApiResponse({ status: 200, description: 'Tournament bracket' })
  async tournamentBracket(
    @Param('id') id: string,
    @Req() req: Request & { userId: string },
  ): Promise<TournamentBracketResponse> {
    const res = await this.history.getTournamentBracket(id, req.userId);
    return TournamentBracketResponseSchema.parse(res);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'List wallet transactions' })
  @ApiResponse({
    status: 200,
    description: 'Transaction history entries',
  })
  async transactions(
    @Query() query: unknown,
  ): Promise<Paginated<TransactionEntry>> {
    const parsed = HistoryQuerySchema.parse(query ?? {});
    const res = await this.history.getTransactions(parsed);
    return PaginatedResponseSchema(TransactionEntrySchema).parse(res);
  }
}

