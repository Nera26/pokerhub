'use client';

import { createQueryHook } from './createQueryHook';
import { fetchDefaultAvatar, type DefaultAvatarResponse } from '@/lib/api';

export const useSettings = createQueryHook<DefaultAvatarResponse>(
  'settings',
  (_client, opts) => fetchDefaultAvatar(opts),
  'settings',
);
