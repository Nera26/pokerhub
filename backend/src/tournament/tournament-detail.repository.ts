import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { TournamentDetail } from './tournament-detail.entity';

@Injectable()
export class TournamentDetailRepository extends Repository<TournamentDetail> {
  constructor(dataSource: DataSource) {
    super(TournamentDetail, dataSource.createEntityManager());
  }
}
