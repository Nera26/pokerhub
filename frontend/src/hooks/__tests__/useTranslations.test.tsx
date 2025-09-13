import { waitFor } from '@testing-library/react';
import { useTranslations } from '../useTranslations';
import type { ApiError } from '@/lib/api/client';
import {
  renderHookWithClient,
  mockFetchLoading,
  mockFetchSuccess,
  mockFetchError,
} from './utils/renderHookWithClient';

describe('useTranslations', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('reports loading state', () => {
    mockFetchLoading();
    const { result } = renderHookWithClient(() => useTranslations('en'));
    expect(result.current.isLoading).toBe(true);
  });

  it('returns data on success', async () => {
    mockFetchSuccess({ messages: { 'layout.skip': 'Skip to main content' } });
    const { result } = renderHookWithClient(() => useTranslations('en'));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      'layout.skip': 'Skip to main content',
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/translations/en',
      expect.any(Object),
    );
  });

  it('falls back when locale unsupported', async () => {
    mockFetchSuccess({ messages: { 'login.title': 'Login' } });
    const { result } = renderHookWithClient(() => useTranslations('fr'));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ 'login.title': 'Login' });
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/translations/fr',
      expect.any(Object),
    );
  });

  it('exposes error state', async () => {
    mockFetchError('boom');
    const { result } = renderHookWithClient(() => useTranslations('en'));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as ApiError).message).toBe(
      'Failed to fetch translations: boom',
    );
  });
});
