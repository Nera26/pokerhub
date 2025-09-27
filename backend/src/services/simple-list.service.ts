import { Repository, FindOptionsOrder, type ObjectLiteral } from 'typeorm';

export class SimpleListService<T extends ObjectLiteral> {
  constructor(protected readonly repo: Repository<T>) {}

  protected find(order: FindOptionsOrder<T> = {}): Promise<T[]> {
    return this.repo.find({ order });
  }
}
