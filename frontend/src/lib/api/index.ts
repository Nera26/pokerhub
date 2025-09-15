import { apiClient } from './client';
import {
  DefaultAvatarResponseSchema,
  type DefaultAvatarResponse,
  PendingWithdrawalsResponseSchema,
  type PendingWithdrawalsResponse,
} from '@shared/types';

export type { DefaultAvatarResponse, PendingWithdrawalsResponse };

export async function fetchDefaultAvatar(): Promise<DefaultAvatarResponse> {
  return apiClient('/config/default-avatar', DefaultAvatarResponseSchema);
}

export async function fetchPendingWithdrawals(
  opts: { signal?: AbortSignal } = {},
): Promise<PendingWithdrawalsResponse> {
  return apiClient('/admin/withdrawals', PendingWithdrawalsResponseSchema, {
    ...(opts.signal && { signal: opts.signal }),
  });
}
