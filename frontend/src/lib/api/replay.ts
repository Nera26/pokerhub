import { apiClient } from './client';
import {
  HandReplayResponse as HandReplayResponseSchema,
  type HandReplayResponse,
} from '@shared/types';

export function fetchHandReplay(
  id: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<HandReplayResponse> {
  return apiClient(`/api/hands/${id}/replay`, HandReplayResponseSchema, {
    signal,
  });
}
