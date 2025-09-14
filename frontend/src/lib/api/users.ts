/* istanbul ignore file */
import { apiClient } from './client';
import { DefaultAvatarResponseSchema } from '@shared/types';
import type { paths } from '@contracts/api';

type DefaultAvatarResponse =
  paths['/config/default-avatar']['get']['responses']['200']['content']['application/json'];

export async function fetchDefaultAvatar(): Promise<DefaultAvatarResponse> {
  return apiClient('/api/config/default-avatar', DefaultAvatarResponseSchema);
}
