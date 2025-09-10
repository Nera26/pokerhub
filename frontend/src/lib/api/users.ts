/* istanbul ignore file */
import { apiClient } from './client';
import { z } from 'zod';

const DefaultAvatarSchema = z.object({ url: z.string() });

export async function fetchDefaultAvatar(): Promise<{ url: string }> {
  return apiClient('/api/users/avatar/default', DefaultAvatarSchema);
}
