import { Injectable } from '@nestjs/common';
import { withSpan } from '../common/tracing';
import { TierRepository } from './tier.repository';
import { TiersSchema, type Tiers } from '../schemas/tiers';

@Injectable()
export class TierService {

  constructor(private readonly repo: TierRepository) {}

  async list(): Promise<Tiers> {
    return withSpan('tiers.list', async (span) => {
      const rows = await this.repo.find({ order: { min: 'ASC' } });
      return TiersSchema.parse(rows);
    });
  }
}
