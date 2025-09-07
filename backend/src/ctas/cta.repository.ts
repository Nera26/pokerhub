import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CTA } from '../database/entities/cta.entity';

@Injectable()
export class CTARepository extends Repository<CTA> {
  constructor(dataSource: DataSource) {
    super(CTA, dataSource.createEntityManager());
  }
}

