import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import {
  GameHistory,
  TournamentHistory,
  WalletHistory,
} from './history.entity';

@Injectable()
export class GameHistoryRepository extends Repository<GameHistory> {
  constructor(dataSource: DataSource) {
    super(GameHistory, dataSource.createEntityManager());
  }
}

@Injectable()
export class TournamentHistoryRepository extends Repository<TournamentHistory> {
  constructor(dataSource: DataSource) {
    super(TournamentHistory, dataSource.createEntityManager());
  }
}

@Injectable()
export class WalletHistoryRepository extends Repository<WalletHistory> {
  constructor(dataSource: DataSource) {
    super(WalletHistory, dataSource.createEntityManager());
  }
}

