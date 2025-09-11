import { getBaseUrl } from '@/lib/base-url';
import { apiClient } from './client';
import { verifyProof } from '@shared/verify';
import {
  HandProofResponse as HandProofResponseSchema,
  HandLogResponse as HandLogResponseSchema,
  HandStateResponse as HandStateResponseSchema,
} from '@shared/types';
import type {
  HandProofResponse,
  HandLogResponse,
  HandStateResponse,
} from '@shared/types';

export async function fetchHandProof(
  id: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<HandProofResponse> {
  const proof = await apiClient(
    `/api/hands/${id}/proof`,
    HandProofResponseSchema,
    {
      signal,
    },
  );
  return proof;
}

export async function fetchVerifiedHandProof(
  id: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<{ proof: HandProofResponse; valid: boolean }> {
  const proof = await fetchHandProof(id, { signal });
  const valid = await verifyProof(proof);
  return { proof, valid };
}

export async function downloadHandProof(id: string): Promise<void> {
  const proof = await fetchHandProof(id);
  const blob = new Blob([JSON.stringify(proof, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${id}-proof.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function fetchHandLog(
  id: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<HandLogResponse> {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/api/hands/${id}/log`, {
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
  return apiClient(
    `/api/hands/${id}/state/${actionIndex}`,
    HandStateResponseSchema,
    { signal },
  );
}
