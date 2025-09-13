import { waitFor } from '@testing-library/react';
import { useTranslations } from '../useTranslations';
import {
  renderHookWithClient,
  mockFetchSuccess,
} from './utils/renderHookWithClient';

describe('useTranslations', () => {
  afterEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  it.each([
    ['en', 'Login'],
    ['es', 'Iniciar sesión'],
  ])('fetches %s messages', async (locale, title) => {
    mockFetchSuccess({ messages: { 'login.title': title } });
    const { result } = renderHookWithClient(() => useTranslations(locale));
    await waitFor(() =>
      expect(result.current.data?.['login.title']).toBe(title),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      `http://localhost:3000/api/translations/${locale}`,
      expect.objectContaining({ method: 'GET' }),
    );
  });
});
