'use client';

import { createQueryHook } from './createQueryHook';
import { fetchTranslations } from '@/lib/api/translations';

export const useTranslations = createQueryHook<Record<string, string>, string>(
  'translations',
  (_client, locale, opts) =>
    fetchTranslations(locale, { signal: opts.signal }).then((r) => r.messages),
  'translations',
);
