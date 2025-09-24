import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import {
  GameHistory,
  TournamentBracket,
  TournamentHistory,
  WalletHistory,
} from './history.entity';
import {
  HistoryRepository,
  GAME_HISTORY_REPOSITORY,
  TOURNAMENT_BRACKET_REPOSITORY,
  TOURNAMENT_HISTORY_REPOSITORY,
  WALLET_HISTORY_REPOSITORY,
} from './history.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GameHistory,
      TournamentHistory,
      WalletHistory,
      TournamentBracket,
    ]),
  ],
  controllers: [HistoryController],
  providers: [
    HistoryService,
    {
      provide: GAME_HISTORY_REPOSITORY,
      useFactory: (dataSource: DataSource) =>
        new HistoryRepository(GameHistory, dataSource),
      inject: [DataSource],
    },
    {
      provide: TOURNAMENT_HISTORY_REPOSITORY,
      useFactory: (dataSource: DataSource) =>
        new HistoryRepository(TournamentHistory, dataSource),
      inject: [DataSource],
    },
    {
      provide: TOURNAMENT_BRACKET_REPOSITORY,
      useFactory: (dataSource: DataSource) =>
        new HistoryRepository(TournamentBracket, dataSource),
      inject: [DataSource],
    },
    {
      provide: WALLET_HISTORY_REPOSITORY,
      useFactory: (dataSource: DataSource) =>
        new HistoryRepository(WalletHistory, dataSource),
      inject: [DataSource],
    },
  ],
})
export class HistoryModule {}

