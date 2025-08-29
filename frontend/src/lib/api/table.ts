/* istanbul ignore file */
import { z } from 'zod';
import { getBaseUrl } from '@/lib/base-url';
import { handleResponse } from './client';
import { serverFetch } from '@/lib/server-fetch';
export { joinTable, bet, buyIn, sitOut, rebuy } from '@/lib/socket';

const PlayerSchema = z.object({
  id: z.number(),
  username: z.string(),
  avatar: z.string(),
  chips: z.number(),
  committed: z.number().optional(),
  isActive: z.boolean().optional(),
  isFolded: z.boolean().optional(),
  sittingOut: z.boolean().optional(),
  isAllIn: z.boolean().optional(),
  isWinner: z.boolean().optional(),
  timeLeft: z.number().optional(),
  cards: z.tuple([z.string(), z.string()]).optional(),
  pos: z.string().optional(),
  lastAction: z.string().optional(),
});

const ChatMessageSchema = z.object({
  id: z.number(),
  username: z.string(),
  avatar: z.string(),
  text: z.string(),
  time: z.string(),
});

const TableDataSchema = z.object({
  smallBlind: z.number(),
  bigBlind: z.number(),
  pot: z.number(),
  communityCards: z.array(z.string()),
  players: z.array(PlayerSchema),
  chatMessages: z.array(ChatMessageSchema),
});
export type TableData = z.infer<typeof TableDataSchema>;

export async function fetchTable(
  id: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<TableData> {
  const baseUrl = getBaseUrl();
  const res = serverFetch(`${baseUrl}/api/tables/${id}`, {
    credentials: 'include',
    signal,
    cache: 'no-store',
  });
  return handleResponse(res, TableDataSchema);
}
