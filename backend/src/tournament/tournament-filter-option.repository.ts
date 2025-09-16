import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { TournamentFilterOptionEntity } from './tournament-filter-option.entity';

@Injectable()
export class TournamentFilterOptionRepository extends Repository<TournamentFilterOptionEntity> {
  constructor(dataSource: DataSource) {
    super(TournamentFilterOptionEntity, dataSource.createEntityManager());
  }
}
