import { z } from 'zod';
import { apiClient } from './client';

const FlagSchema = z.object({
  id: z.string(),
  player: z.string(),
  history: z.array(z.string()),
  action: z.enum(['warn', 'restrict', 'ban']),
});

export type Flag = z.infer<typeof FlagSchema>;

const FlagsResponseSchema = z.array(FlagSchema);

const NextActionSchema = z.object({ next: FlagSchema.shape.action });

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

export async function fetchNextAction(
  action: Flag['action'],
): Promise<Flag['action']> {
  const { next } = await apiClient(
    `/api/anti-cheat/next-action?current=${action}`,
    NextActionSchema,
  );
  return next;
}
