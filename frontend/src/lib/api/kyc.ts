import { apiClient } from './client';
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
  return apiClient(`/api/admin/kyc/${id}/denial`, KycDenialResponseSchema, {
    signal: opts.signal,
  });
}

export function startKyc(
  id: string,
  opts: { signal?: AbortSignal } = {},
): Promise<MessageResponse> {
  return apiClient(`/api/wallet/${id}/kyc`, MessageResponseSchema, {
    method: 'POST',
    signal: opts.signal,
  });
}
