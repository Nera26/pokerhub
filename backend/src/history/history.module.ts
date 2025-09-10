import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import {
  GameHistory,
  TournamentHistory,
  WalletHistory,
} from './history.entity';
import {
  GameHistoryRepository,
  TournamentHistoryRepository,
  WalletHistoryRepository,
} from './history.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([GameHistory, TournamentHistory, WalletHistory]),
  ],
  controllers: [HistoryController],
  providers: [
    HistoryService,
    GameHistoryRepository,
    TournamentHistoryRepository,
    WalletHistoryRepository,
  ],
})
export class HistoryModule {}

