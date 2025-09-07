import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { GameType } from '../database/entities/game-type.entity';

@Injectable()
export class GameTypeRepository extends Repository<GameType> {
  constructor(dataSource: DataSource) {
    super(GameType, dataSource.createEntityManager());
  }
}
