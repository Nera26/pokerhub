import { apiClient } from './client';
import { GameTypeListSchema, type GameTypeList } from '@shared/types';

export async function fetchGameTypes({ signal }: { signal?: AbortSignal } = {}): Promise<GameTypeList> {
  return apiClient('/api/game-types', GameTypeListSchema, { signal });
}
