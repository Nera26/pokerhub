import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { useIban } from '@/hooks/useIban';
import { useIbanHistory } from '@/hooks/useIbanHistory';
import type { ApiError } from '@/lib/api/client';

describe('useIban', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('indicates loading state', () => {
    const fetchMock = jest.fn<Promise<Response>, []>(() => new Promise(() => {}));
    global.fetch = fetchMock as unknown as typeof fetch;
    const client = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useIban(), { wrapper });
    expect(result.current.isLoading).toBe(true);
  });

  it('returns empty data when IBAN not set', async () => {
    const fetchMock = jest.fn<Promise<Response>, []>().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        iban: '',
        masked: '',
        holder: '',
        instructions: '',
        updatedBy: '',
        updatedAt: '',
      }),
    } as unknown as Response);
    global.fetch = fetchMock as unknown as typeof fetch;
    const client = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useIban(), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data).toEqual({
      iban: '',
      masked: '',
      holder: '',
      instructions: '',
      updatedBy: '',
      updatedAt: '',
    });
  });

  it('reports error on failure', async () => {
    const fetchMock = jest
      .fn<Promise<Response>, []>()
      .mockRejectedValue(new Error('boom'));
    global.fetch = fetchMock as unknown as typeof fetch;
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useIban(), { wrapper });
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect((result.current.error as ApiError).message).toBe('Failed to fetch IBAN: boom');
  });
});

describe('useIbanHistory', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('indicates loading state', () => {
    const fetchMock = jest.fn<Promise<Response>, []>(() => new Promise(() => {}));
    global.fetch = fetchMock as unknown as typeof fetch;
    const client = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useIbanHistory(), { wrapper });
    expect(result.current.isLoading).toBe(true);
  });

  it('returns empty history array', async () => {
    const fetchMock = jest.fn<Promise<Response>, []>().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ history: [] }),
    } as unknown as Response);
    global.fetch = fetchMock as unknown as typeof fetch;
    const client = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useIbanHistory(), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.history).toEqual([]);
  });

  it('reports error on failure', async () => {
    const fetchMock = jest
      .fn<Promise<Response>, []>()
      .mockRejectedValue(new Error('boom'));
    global.fetch = fetchMock as unknown as typeof fetch;
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useIbanHistory(), { wrapper });
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect((result.current.error as ApiError).message).toBe(
      'Failed to fetch IBAN history: boom',
    );
  });
});
