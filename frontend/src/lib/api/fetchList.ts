import { z, type ZodType } from 'zod';
import { apiClient } from './client';

export function fetchList<T>(
  path: string,
  schema: ZodType<T>,
  opts: { signal?: AbortSignal } = {},
): Promise<T[]> {
  return apiClient(path, z.array(schema), { signal: opts.signal });
}
