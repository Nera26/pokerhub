import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  GameHistoryPageSchema,
  HistoryQuerySchema,
  TournamentHistoryPageSchema,
  TransactionHistoryPageSchema,
  TournamentBracketResponseSchema,
  type GameHistoryPage,
  type TournamentHistoryPage,
  type TransactionHistoryPage,
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
  async games(@Req() req: Request): Promise<GameHistoryPage> {
    const filters = HistoryQuerySchema.parse(req.query);
    const res = await this.history.getGames(filters);
    return GameHistoryPageSchema.parse(res);
  }

  @Get('tournaments')
  @ApiOperation({ summary: 'List tournament history' })
  @ApiResponse({
    status: 200,
    description: 'Tournament history entries',
  })
  async tournaments(@Req() req: Request): Promise<TournamentHistoryPage> {
    const filters = HistoryQuerySchema.parse(req.query);
    const res = await this.history.getTournaments(filters);
    return TournamentHistoryPageSchema.parse(res);
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
  async transactions(@Req() req: Request): Promise<TransactionHistoryPage> {
    const filters = HistoryQuerySchema.parse(req.query);
    const res = await this.history.getTransactions(filters);
    return TransactionHistoryPageSchema.parse(res);
  }
}

