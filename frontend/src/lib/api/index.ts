import { createApiClient } from './factory';
import type { paths } from '@contracts/api';

export const client = createApiClient();

export type DefaultAvatarResponse =
  paths['/config/default-avatar']['get']['responses']['200']['content']['application/json'];

export async function fetchDefaultAvatar(): Promise<DefaultAvatarResponse> {
  const { data } = await client.GET('/config/default-avatar');
  return data!;
}

export type PendingWithdrawalsResponse =
  paths['/admin/withdrawals']['get']['responses']['200']['content']['application/json'];

export async function fetchPendingWithdrawals(
  opts: { signal?: AbortSignal } = {},
): Promise<PendingWithdrawalsResponse> {
  const { data } = await client.GET('/admin/withdrawals', {
    signal: opts.signal,
  });
  return data!;
}
