import { apiClient } from './client';
import { LanguagesResponseSchema, type LanguagesResponse } from '@shared/types';

export async function fetchLanguages({
  signal,
}: { signal?: AbortSignal } = {}): Promise<LanguagesResponse> {
  return apiClient('/api/languages', LanguagesResponseSchema, { signal });
}
