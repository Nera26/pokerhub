'use client';

import type { ZodSchema } from 'zod';
import { createGetHook } from './useApiQuery';

export function createSimpleGetHook<
  TResult,
  TSchema extends ZodSchema<TResult>,
>(path: string, schema: TSchema) {
  return createGetHook<TResult>(path, schema);
}

export default createSimpleGetHook;
