import { z, type ZodType } from 'zod';
import { getBaseUrl } from '@/lib/base-url';
import { handleResponse, ApiError } from './client';
import { serverFetch } from '@/lib/server-fetch';
import { TableSchema, type Table, TournamentSchema, type Tournament } from '@shared/types';

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
