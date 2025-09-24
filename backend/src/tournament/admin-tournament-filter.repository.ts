import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AdminTournamentFilterEntity } from './admin-tournament-filter.entity';

@Injectable()
export class AdminTournamentFilterRepository extends Repository<AdminTournamentFilterEntity> {
  constructor(dataSource: DataSource) {
    super(AdminTournamentFilterEntity, dataSource.createEntityManager());
  }
}
