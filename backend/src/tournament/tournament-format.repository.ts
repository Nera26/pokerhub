import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { TournamentFormatEntity } from './tournament-format.entity';

@Injectable()
export class TournamentFormatRepository extends Repository<TournamentFormatEntity> {
  constructor(dataSource: DataSource) {
    super(TournamentFormatEntity, dataSource.createEntityManager());
  }
}
