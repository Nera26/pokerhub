import { waitFor } from '@testing-library/react';
import { useTables, useTournaments } from '../useLobbyData';
import type { ApiError } from '@/lib/api/client';
import {
  renderHookWithClient,
  mockFetchSuccess,
  mockFetchError,
} from './utils/renderHookWithClient';

describe('useLobbyData hooks', () => {
  describe('useTables', () => {
    it('returns tables on success', async () => {
      mockFetchSuccess([
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
      ]);

      const { result } = renderHookWithClient(() => useTables());
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.[0].tableName).toBe('Table 1');
    });

    it('exposes error state', async () => {
      mockFetchError('fail');

      const { result } = renderHookWithClient(() => useTables());
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect((result.current.error as ApiError).message).toBe(
        'Failed to fetch tables: fail',
      );
    });
  });

  describe('useTournaments', () => {
    it('returns tournaments on success', async () => {
      mockFetchSuccess([
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
      ]);

      const { result } = renderHookWithClient(() => useTournaments());
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.[0].title).toBe('T1');
    });

    it('exposes error state', async () => {
      mockFetchError('fail');

      const { result } = renderHookWithClient(() => useTournaments());
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect((result.current.error as ApiError).message).toBe(
        'Failed to fetch tournaments: fail',
      );
    });
  });
});
