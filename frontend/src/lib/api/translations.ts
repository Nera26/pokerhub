import { apiClient } from './client';
import {
  TranslationsResponseSchema,
  LanguagesResponseSchema,
  type TranslationsResponse,
  type LanguagesResponse,
} from '@shared/types';

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
