import { getBaseUrl } from '@/lib/base-url';
import { serverFetch } from '@/lib/server-fetch';
import { handleResponse } from './client';
import {
  HandProofSchema,
  type HandProof,
  HandLogResponseSchema,
  type HandLogResponse,
  HandStateResponseSchema,
  type HandStateResponse,
} from '@shared/types';

export async function fetchHandProof(
  id: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<HandProof> {
  const baseUrl = getBaseUrl();
  const res = serverFetch(`${baseUrl}/api/hands/${id}/proof`, {
    credentials: 'include',
    signal,
  });
  return handleResponse(res, HandProofSchema);
}

export async function fetchHandLog(
  id: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<HandLogResponse> {
  const baseUrl = getBaseUrl();
  const res = await serverFetch(`${baseUrl}/api/hands/${id}/log`, {
    credentials: 'include',
    signal,
  });
  if (!res.ok) {
    throw new Error('Failed to fetch hand log');
  }
  const text = await res.text();
  return HandLogResponseSchema.parse(text);
}

export async function fetchHandState(
  id: string,
  actionIndex: number,
  { signal }: { signal?: AbortSignal } = {},
): Promise<HandStateResponse> {
  const baseUrl = getBaseUrl();
  const res = serverFetch(
    `${baseUrl}/api/hands/${id}/state/${actionIndex}`,
    {
      credentials: 'include',
      signal,
    },
  );
  return handleResponse(res, HandStateResponseSchema);
}
