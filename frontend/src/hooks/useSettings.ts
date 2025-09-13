'use client';

import { createQueryHook } from './createQueryHook';
import {
  DefaultAvatarResponseSchema,
  type DefaultAvatarResponse,
} from '@shared/types';

export const useSettings = createQueryHook<DefaultAvatarResponse>(
  'settings',
  (client, opts) =>
    client('/api/config/default-avatar', DefaultAvatarResponseSchema, opts),
  'settings',
);
