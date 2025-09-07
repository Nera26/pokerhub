import { z } from 'zod';
import { apiClient } from './client';
import { GameTypeSchema, type GameType } from '@shared/types';

export async function fetchGameTypes({ signal }: { signal?: AbortSignal } = {}): Promise<GameType[]> {
  return apiClient('/api/game-types', z.array(GameTypeSchema), { signal });
}
