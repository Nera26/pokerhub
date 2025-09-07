import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Tier } from '../database/entities/tier.entity';

@Injectable()
export class TierRepository extends Repository<Tier> {
  constructor(dataSource: DataSource) {
    super(Tier, dataSource.createEntityManager());
  }
}
