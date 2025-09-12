'use client';

import type { ZodSchema } from 'zod';
import { createQueryHook } from './createQueryHook';

export function createGetHook<T>(path: string, schema: ZodSchema<T>) {
  const trimmed = path.replace(/^\/?api\/?/, '');
  const key = trimmed.replace(/\//g, '-');
  const label = trimmed.replace(/[\/-]/g, ' ');
  return createQueryHook<T>(
    key,
    (client, _params, opts) => client(path, schema, opts),
    label,
  );
}
