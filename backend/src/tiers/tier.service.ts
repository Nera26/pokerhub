import { Injectable } from '@nestjs/common';
import { trace } from '@opentelemetry/api';
import { TierRepository } from './tier.repository';
import { TiersSchema, type Tiers } from '../schemas/tiers';

@Injectable()
export class TierService {
  private static readonly tracer = trace.getTracer('tiers');

  constructor(private readonly repo: TierRepository) {}

  async list(): Promise<Tiers> {
    return TierService.tracer.startActiveSpan('tiers.list', async (span) => {
      const rows = await this.repo.find({ order: { min: 'ASC' } });
      span.end();
      return TiersSchema.parse(rows);
    });
  }
}
