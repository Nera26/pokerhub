import { getBaseUrl } from '@/lib/base-url';
import { handleResponse } from './client';
import { serverFetch } from '@/lib/server-fetch';
import { HandProof, HandProofSchema } from '@shared/types';

export async function getHandProof(id: string): Promise<HandProof> {
  return handleResponse(
    serverFetch(`${getBaseUrl()}/api/hands/${id}/proof`),
    HandProofSchema,
  );
}
