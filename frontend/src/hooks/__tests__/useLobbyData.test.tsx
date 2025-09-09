import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTables, useTournaments, useCTAs } from '../useLobbyData';
import type { ReactNode } from 'react';
import type { ApiError } from '@/lib/api/client';

describe('useLobbyData hooks', () => {
  const wrapper = ({ children }: { children: ReactNode }) => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('useTables', () => {
    it('returns tables on success', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [
          {
            id: '1',
            tableName: 'Table 1',
            gameType: 'texas',
            stakes: { small: 1, big: 2 },
            players: { current: 0, max: 9 },
            buyIn: { min: 20, max: 200 },
            stats: { handsPerHour: 0, avgPot: 0, rake: 0 },
            createdAgo: 'just now',
          },
        ],
      }) as unknown as typeof fetch;

      const { result } = renderHook(() => useTables(), { wrapper });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.[0].tableName).toBe('Table 1');
    });

    it('exposes error state', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Server error',
        json: async () => ({ message: 'fail' }),
      }) as unknown as typeof fetch;

      const { result } = renderHook(() => useTables(), { wrapper });
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect((result.current.error as ApiError).message).toBe(
        'Failed to fetch tables: fail',
      );
    });
  });

  describe('useTournaments', () => {
    it('returns tournaments on success', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [
          {
            id: '1',
            title: 'T1',
            gameType: 'texas',
            buyIn: 10,
            fee: 1,
            prizePool: 100,
            state: 'REG_OPEN',
            players: { current: 0, max: 100 },
            registered: false,
          },
        ],
      }) as unknown as typeof fetch;

      const { result } = renderHook(() => useTournaments(), { wrapper });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.[0].title).toBe('T1');
    });

    it('exposes error state', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Server error',
        json: async () => ({ message: 'fail' }),
      }) as unknown as typeof fetch;

      const { result } = renderHook(() => useTournaments(), { wrapper });
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect((result.current.error as ApiError).message).toBe(
        'Failed to fetch tournaments: fail',
      );
    });
  });

  describe('useCTAs', () => {
    it('returns CTAs on success', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [
          { id: '1', label: 'Play', href: '/play', variant: 'primary' },
        ],
      }) as unknown as typeof fetch;

      const { result } = renderHook(() => useCTAs(), { wrapper });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.[0].label).toBe('Play');
    });

    it('exposes error state', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Server error',
        json: async () => ({ message: 'fail' }),
      }) as unknown as typeof fetch;

      const { result } = renderHook(() => useCTAs(), { wrapper });
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect((result.current.error as ApiError).message).toBe(
        'Failed to fetch CTAs: fail',
      );
    });
  });
});
