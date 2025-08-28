import { getBaseUrl } from '@/lib/base-url';
import { serverFetch } from '@/lib/server-fetch';
import { handleResponse } from './client';
import {
  HandProofResponseSchema,
  type HandProofResponse,
  HandLogResponseSchema,
  type HandLogResponse,
} from '@shared/types';

export async function fetchHandProof(
  id: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<HandProofResponse> {
  const baseUrl = getBaseUrl();
  const res = serverFetch(`${baseUrl}/api/hands/${id}/proof`, {
    credentials: 'include',
    signal,
  });
  return handleResponse(res, HandProofResponseSchema);
}

export async function fetchHandLog(
  id: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<HandLogResponse> {
  const baseUrl = getBaseUrl();
  const res = await serverFetch(`${baseUrl}/api/game/hand/${id}/log`, {
    credentials: 'include',
    signal,
  });
  if (!res.ok) {
    throw new Error('Failed to fetch hand log');
  }
  const text = await res.text();
  return HandLogResponseSchema.parse(text);
}
