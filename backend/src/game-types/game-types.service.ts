import { Injectable } from '@nestjs/common';
import { trace } from '@opentelemetry/api';
import { GameTypeList, GameTypeListSchema } from '@shared/types';
import { GameTypeRepository } from './game-type.repository';

@Injectable()
export class GameTypesService {
  private static readonly tracer = trace.getTracer('game-types');

  constructor(private readonly repo: GameTypeRepository) {}

  async list(): Promise<GameTypeList> {
    return GameTypesService.tracer.startActiveSpan(
      'game-types.list',
      async (span) => {
        const rows = await this.repo.find({ order: { id: 'ASC' } });
        span.end();
        return GameTypeListSchema.parse(rows);
      },
    );
  }
}
