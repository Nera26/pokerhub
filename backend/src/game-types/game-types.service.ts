import { Injectable } from '@nestjs/common';
import { withSpan } from '../common/tracing';
import { GameTypeList, GameTypeListSchema } from '@shared/types';
import { GameTypeRepository } from './game-type.repository';

@Injectable()
export class GameTypesService {

  constructor(private readonly repo: GameTypeRepository) {}

  async list(): Promise<GameTypeList> {
    return withSpan('game-types.list', async (span) => {
      const rows = await this.repo.find({ order: { id: 'ASC' } });
      return GameTypeListSchema.parse(rows);
    });
  }
}
