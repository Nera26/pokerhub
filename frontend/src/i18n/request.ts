import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { fetchTranslations } from '@/lib/api/translations';

export default getRequestConfig(async () => {
  const store = await cookies();
  const locale = store.get('locale')?.value || 'en';

  function unflatten(messages: Record<string, string>) {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(messages)) {
      const parts = key.split('.');
      let obj = result;
      for (let i = 0; i < parts.length - 1; i++) {
        obj[parts[i]] = obj[parts[i]] ?? {};
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = value;
    }
    return result;
  }

  async function fetchMessages(locale: string) {
    const { messages } = await fetchTranslations(locale);
    return unflatten(messages);
  }

  let messages;
  try {
    messages = await fetchMessages(locale);
  } catch {
    messages = await fetchMessages('en');
  }

  return { locale, messages };
});
