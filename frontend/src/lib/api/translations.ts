import { apiClient } from './client';
import { z } from 'zod';
import { LanguagesResponseSchema, type LanguagesResponse } from '@shared/types';

const TranslationsResponseSchema = z.object({
  messages: z.record(z.string()),
});
type TranslationsResponse = z.infer<typeof TranslationsResponseSchema>;

export async function fetchTranslations(
  locale: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<TranslationsResponse> {
  return apiClient(`/api/translations/${locale}`, TranslationsResponseSchema, {
    signal,
  });
}

export async function fetchLanguages({
  signal,
}: { signal?: AbortSignal } = {}): Promise<LanguagesResponse> {
  return apiClient('/api/languages', LanguagesResponseSchema, { signal });
}
