'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchLanguages } from '@/lib/api/translations';
import type { LanguagesResponse } from '@shared/types';

export default function LanguageSelector() {
  const locale = useLocale();
  const router = useRouter();
  const { data, isLoading, error } = useQuery<LanguagesResponse>({
    queryKey: ['languages'],
    queryFn: ({ signal }) => fetchLanguages({ signal }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  if (isLoading) return <div>Loading languages...</div>;
  if (error) return <div>Error loading languages</div>;

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const newLocale = event.target.value;
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax${secure}`;
    router.refresh();
  }

  return (
    <>
      <label htmlFor="language-selector" className="sr-only">
        Language
      </label>
      <select
        id="language-selector"
        onChange={handleChange}
        value={locale}
        className="ml-4 rounded border border-accent-yellow bg-card-bg p-1 text-sm"
      >
        {data?.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </>
  );
}
