import { z, type ZodType } from 'zod';
import { getBaseUrl } from '@/lib/base-url';
import { handleResponse, ApiError } from './client';
import { serverFetch } from '@/lib/server-fetch';
import type { GameType } from '@/types/game-type';

const gameTypeEnum = z.enum(['texas', 'omaha', 'allin', 'tournaments']);

const TableSchema = z.object({
  id: z.string(),
  tableName: z.string(),
  gameType: gameTypeEnum,
  stakes: z.object({ small: z.number(), big: z.number() }),
  players: z.object({ current: z.number(), max: z.number() }),
  buyIn: z.object({ min: z.number(), max: z.number() }),
  stats: z.object({
    handsPerHour: z.number(),
    avgPot: z.number(),
    rake: z.number(),
  }),
  createdAgo: z.string(),
});
export type Table = Omit<z.infer<typeof TableSchema>, 'gameType'> & {
  gameType: GameType;
};

const TournamentSchema = z.object({
  id: z.string(),
  title: z.string(),
  buyIn: z.number(),
  fee: z.number().optional(),
  prizePool: z.union([z.number(), z.string()]),
  players: z.object({ current: z.number(), max: z.number() }),
  registered: z.boolean(),
});
export type Tournament = z.infer<typeof TournamentSchema>;

export async function fetchLobbyData<T>(
  endpoint: string,
  schema: ZodType<T>,
  { signal }: { signal?: AbortSignal } = {},
): Promise<T> {
  const baseUrl = getBaseUrl();
  try {
    const res = await serverFetch(`${baseUrl}/api/${endpoint}`, {
      credentials: 'include',
      signal,
    });
    if (!res.ok) {
      const details = await res.text().catch(() => undefined);
      throw {
        status: res.status,
        message: res.statusText,
        details,
      } as ApiError;
    }
    return await handleResponse(res, schema);
  } catch (err) {
    if (err instanceof Error) {
      throw {
        message: `Failed to fetch ${endpoint}: ${err.message}`,
      } as ApiError;
    }
    throw err as ApiError;
  }
}

export async function getTables({
  signal,
}: {
  signal?: AbortSignal;
} = {}): Promise<Table[]> {
  const baseUrl = getBaseUrl();
  try {
    const res = await serverFetch(`${baseUrl}/api/tables`, {
      credentials: 'include',
      cache: 'no-store',
      signal,
    });
    if (!res.ok) {
      const details = await res.text().catch(() => undefined);
      throw {
        status: res.status,
        message: res.statusText,
        details,
      } as ApiError;
    }
    return await handleResponse(res, z.array(TableSchema));
  } catch (err) {
    if (err instanceof Error) {
      throw { message: `Failed to fetch tables: ${err.message}` } as ApiError;
    }
    throw err as ApiError;
  }
}

export async function fetchTables({
  signal,
}: {
  signal?: AbortSignal;
}): Promise<Table[]> {
  return getTables({ signal });
}

export async function fetchTournaments({
  signal,
}: {
  signal?: AbortSignal;
}): Promise<Tournament[]> {
  return fetchLobbyData<Tournament[]>(
    'tournaments',
    z.array(TournamentSchema),
    { signal },
  );
}
