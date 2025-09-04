import { z, type ZodType } from 'zod';
import { apiClient, ApiError } from './client';
import type { components } from '@contracts/api';
import {
  TableSchema,
  TournamentSchema,
  TournamentDetailSchema,
  type Table,
  type Tournament,
  type TournamentDetail,
  MessageResponseSchema,
  type MessageResponse,
} from '@shared/types';

export type { Table, Tournament, TournamentDetail };

export async function fetchLobbyData<T>(
  endpoint: string,
  schema: ZodType<T>,
  { signal }: { signal?: AbortSignal } = {},
): Promise<T> {
  try {
    return await apiClient(`/api/${endpoint}`, schema, { signal });
  } catch (err) {
    const apiErr = err as ApiError;
    if (apiErr.status !== undefined) {
      throw apiErr;
    }
    throw { message: `Failed to fetch ${endpoint}: ${apiErr.message}` } as ApiError;
  }
}

export async function getTables({
  signal,
}: {
  signal?: AbortSignal;
} = {}): Promise<components['schemas']['Table'][]> {
  try {
    return await apiClient('/api/tables', z.array(TableSchema), {
      signal,
      cache: 'no-store',
    });
  } catch (err) {
    const apiErr = err as ApiError;
    if (apiErr.status !== undefined) {
      throw apiErr;
    }
    throw { message: `Failed to fetch tables: ${apiErr.message}` } as ApiError;
  }
}

export async function fetchTables({
  signal,
  }:
    {
      signal?: AbortSignal;
    }): Promise<components['schemas']['Table'][]> {
  return getTables({ signal });
}

export async function fetchTournaments({
  signal,
}: {
  signal?: AbortSignal;
  }): Promise<components['schemas']['Tournament'][]> {
  return fetchLobbyData<components['schemas']['Tournament'][]>(
    'tournaments',
    z.array(TournamentSchema),
    { signal },
  );
}

export async function getTournament(
  id: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<components['schemas']['TournamentDetail']> {
  return fetchLobbyData<components['schemas']['TournamentDetail']>(
    `tournaments/${id}`,
    TournamentDetailSchema,
    { signal },
  );
}

export async function registerTournament(
  id: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<MessageResponse> {
  return apiClient(`/api/tournaments/${id}/register`, MessageResponseSchema, {
    method: 'POST',
    signal,
  });
}

export async function withdrawTournament(
  id: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<MessageResponse> {
  return apiClient(`/api/tournaments/${id}/withdraw`, MessageResponseSchema, {
    method: 'POST',
    signal,
  });
}
