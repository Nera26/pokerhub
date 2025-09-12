'use client';

import { createQueryHook } from './createQueryHook';
import { fetchTranslations } from '@/lib/api/translations';

export const useTranslations = createQueryHook<Record<string, string>, string>(
  'translations',
  (_client, lang, opts) =>
    fetchTranslations(lang, { signal: opts.signal }).then((r) => r.messages),
  'translations',
);
