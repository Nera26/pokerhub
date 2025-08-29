import { getBaseUrl } from '@/lib/base-url';
import { serverFetch } from '@/lib/server-fetch';
import { handleResponse } from './client';
import {
  KycDenialResponseSchema,
  type KycDenialResponse,
  MessageResponseSchema,
  type MessageResponse,
} from '@shared/types';

export function getKycDenial(
  id: string,
  opts: { signal?: AbortSignal } = {},
): Promise<KycDenialResponse> {
  const baseUrl = getBaseUrl();
  const res = serverFetch(`${baseUrl}/api/admin/kyc/${id}/denial`, {
    credentials: 'include',
    signal: opts.signal,
  });
  return handleResponse(res, KycDenialResponseSchema);
}

export function startKyc(
  id: string,
  opts: { signal?: AbortSignal } = {},
): Promise<MessageResponse> {
  const baseUrl = getBaseUrl();
  const res = serverFetch(`${baseUrl}/api/wallet/${id}/kyc`, {
    method: 'POST',
    credentials: 'include',
    signal: opts.signal,
  });
  return handleResponse(res, MessageResponseSchema);
}
