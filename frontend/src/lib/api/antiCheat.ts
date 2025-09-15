import { z } from 'zod';
import { apiClient } from './client';
export type { ApiError } from './client';

const FlagSchema = z.object({
  id: z.string(),
  player: z.string(),
  history: z.array(z.string()),
  action: z.enum(['warn', 'restrict', 'ban']),
});

export type Flag = z.infer<typeof FlagSchema>;

const FlagsResponseSchema = z.array(FlagSchema);

export async function fetchFlags(): Promise<Flag[]> {
  return apiClient('/api/anti-cheat/flags', FlagsResponseSchema);
}

export async function updateFlag(
  id: string,
  action: Flag['action'],
): Promise<Flag> {
  return apiClient(`/api/anti-cheat/flags/${id}`, FlagSchema, {
    method: 'PUT',
    body: { action },
  });
}
