import { TableThemeResponseSchema, type TableThemeResponse } from '@shared/types';

/**
 * Fetch the current table theme from the backend.
 */
export async function fetchTableTheme(
  opts: { signal?: AbortSignal } = {},
): Promise<TableThemeResponse> {
  const res = await fetch('/api/config/table-theme', { signal: opts.signal });
  if (!res.ok) {
    throw new Error(`Failed to fetch table theme: ${res.status}`);
  }
  const json = await res.json();
  return TableThemeResponseSchema.parse(json);
}

export default fetchTableTheme;
