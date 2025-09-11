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
  TournamentFiltersResponseSchema,
  type TournamentFilterOption,
} from '@shared/types';

export type { Table, Tournament, TournamentDetails, CTA };

async function fetchLobbyData<T>(
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
    throw {
      message: `Failed to fetch ${endpoint}: ${apiErr.message}`,
    } as ApiError;
  }
}

export async function fetchTables({
  signal,
}: {
  signal?: AbortSignal;
} = {}): Promise<components['schemas']['Table'][]> {
  return apiClient('/api/tables', z.array(TableSchema), {
    signal,
    cache: 'no-store',
  });
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

export async function fetchTournamentFilters({
  signal,
}: { signal?: AbortSignal } = {}): Promise<TournamentFilterOption[]> {
  return fetchLobbyData<TournamentFilterOption[]>(
    'tournaments/filters',
    TournamentFiltersResponseSchema,
    { signal },
  );
}

export async function fetchCTAs({
  signal,
}: {
  signal?: AbortSignal;
} = {}): Promise<CTA[]> {
  return fetchLobbyData<CTA[]>('ctas', z.array(CTASchema), { signal });
}

async function mutateCTA(
  id: string | null,
  cta: CTA,
  { signal }: { signal?: AbortSignal } = {},
): Promise<CTA> {
  const url = id ? `/api/ctas/${id}` : '/api/ctas';
  const method = id ? 'PUT' : 'POST';
  return apiClient(url, CTASchema, {
    method,
    body: cta,
    signal,
  });
}

export const createCTA = (
  cta: CTA,
  opts?: { signal?: AbortSignal },
): Promise<CTA> => mutateCTA(null, cta, opts);

export const updateCTA = (
  id: string,
  cta: CTA,
  opts?: { signal?: AbortSignal },
): Promise<CTA> => mutateCTA(id, cta, opts);

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
