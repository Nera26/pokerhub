import { Repository, FindOptionsOrder } from 'typeorm';

export class SimpleListService<T> {
  constructor(protected readonly repo: Repository<T>) {}

  protected find(order: FindOptionsOrder<T> = {}): Promise<T[]> {
    return this.repo.find({ order });
  }
}
