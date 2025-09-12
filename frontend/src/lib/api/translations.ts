import { apiClient } from './client';
import {
  TranslationsResponseSchema,
  type TranslationsResponse,
} from '@shared/types';

export async function fetchTranslations(
  lang: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<TranslationsResponse> {
  return apiClient(`/api/translations/${lang}`, TranslationsResponseSchema, {
    signal,
  });
}
