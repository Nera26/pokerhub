'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function LanguageSelector() {
  const locale = useLocale();
  const router = useRouter();

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
        <option value="en">English</option>
        <option value="es">Español</option>
      </select>
    </>
  );
}
