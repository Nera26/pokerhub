/** @jest-environment node */

import { fetchTranslations } from '@/lib/api/translations';

describe('translations api', () => {
  afterEach(() => {
    (fetch as jest.Mock).mockReset();
  });

  it.each([
    ['en', 'Login'],
    ['es', 'Iniciar sesión'],
  ])('fetches %s messages', async (locale, title) => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ messages: { 'login.title': title } }),
    });

    const res = await fetchTranslations(locale);
    expect(res.messages['login.title']).toBe(title);
    expect(fetch).toHaveBeenCalledWith(
      `http://localhost:3000/api/translations/${locale}`,
      expect.objectContaining({ method: 'GET' }),
    );
  });
});
