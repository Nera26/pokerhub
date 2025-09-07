import { z, type ZodType } from 'zod';
import { apiClient, ApiError } from './client';
import type { components } from '@contracts/api';
import {
  TableSchema,
  TournamentSchema,
  TournamentDetailsSchema,
  type Table,
  type Tournament,
  type TournamentDetails,
  MessageResponseSchema,
  type MessageResponse,
  CTASchema,
  type CTA,
} from '@shared/types';

export type { Table, Tournament, TournamentDetails, CTA };

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

export async function fetchCTAs({
  signal,
}: {
  signal?: AbortSignal;
} = {}): Promise<CTA[]> {
  return fetchLobbyData<CTA[]>(
    'ctas',
    z.array(CTASchema),
    { signal },
  );
}

export async function fetchTournamentDetails(
  id: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<components['schemas']['TournamentDetails']> {
  return fetchLobbyData<components['schemas']['TournamentDetails']>(
    `tournaments/${id}`,
    TournamentDetailsSchema,
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
