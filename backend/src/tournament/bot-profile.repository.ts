import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { BotProfile } from './bot-profile.entity';

@Injectable()
export class BotProfileRepository extends Repository<BotProfile> {
  constructor(dataSource: DataSource) {
    super(BotProfile, dataSource.createEntityManager());
  }
}
