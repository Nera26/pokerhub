import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { TransactionColumnEntity } from './transaction-column.entity';

@Injectable()
export class TransactionColumnRepository extends Repository<TransactionColumnEntity> {
  constructor(dataSource: DataSource) {
    super(TransactionColumnEntity, dataSource.createEntityManager());
  }
}
