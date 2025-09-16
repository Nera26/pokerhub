'use client';

import type { ZodSchema } from 'zod';
import { createGetHook } from './useApiQuery';

export function createSimpleGetHook<Output>(
  endpoint: string,
  schema: ZodSchema<Output>,
) {
  return createGetHook<Output>(endpoint, schema);
}
