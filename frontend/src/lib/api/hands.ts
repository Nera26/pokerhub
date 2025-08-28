import { getBaseUrl } from '@/lib/base-url';
import { serverFetch } from '@/lib/server-fetch';
import { handleResponse } from './client';
import { HandProofResponseSchema, type HandProofResponse } from '@shared/types';

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
