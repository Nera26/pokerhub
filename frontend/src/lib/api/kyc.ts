import { getBaseUrl } from '@/lib/base-url';
import { serverFetch } from '@/lib/server-fetch';
import { handleResponse } from './client';
import {
  KycDenialResponseSchema,
  type KycDenialResponse,
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
