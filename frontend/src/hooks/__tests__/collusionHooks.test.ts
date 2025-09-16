import { act, waitFor } from '@testing-library/react';
import { renderHookWithClient } from './utils/renderHookWithClient';

jest.mock('@/lib/api/collusion', () => ({
  listFlaggedSessions: jest.fn(),
  getActionHistory: jest.fn(),
  applyAction: jest.fn(),
}));
import {
  listFlaggedSessions,
  getActionHistory,
  applyAction,
} from '@/lib/api/collusion';
import {
  useFlaggedSessions,
  useActionHistory,
  useApplyCollusionAction,
} from '@/hooks/collusion';
import type { FlaggedSession, ReviewActionLog } from '@shared/types';
import { useAuthStore } from '@/app/store/authStore';

describe('collusion hooks', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: 't' });
  });

  afterEach(() => {
    useAuthStore.setState({ token: null });
    jest.clearAllMocks();
  });

  it('fetches sessions and history', async () => {
    const sessions: FlaggedSession[] = [
      { id: '1', users: ['a', 'b'], status: 'flagged' },
    ];
    const history: ReviewActionLog[] = [
      { action: 'warn', reviewerId: 'r1', timestamp: 1 },
    ];
    (listFlaggedSessions as jest.Mock).mockResolvedValueOnce(sessions);
    (getActionHistory as jest.Mock).mockResolvedValueOnce(history);

    const { result } = renderHookWithClient(() => {
      const flagged = useFlaggedSessions();
      const historyMap = useActionHistory(flagged.data ?? []);
      return { flagged, historyMap };
    });

    await waitFor(() => expect(result.current.flagged.data).toBeDefined());
    expect(result.current.flagged.data).toEqual(sessions);
    await waitFor(() =>
      expect(result.current.historyMap['1']).toEqual(history),
    );
  });

  it('handles network error', async () => {
    (listFlaggedSessions as jest.Mock).mockRejectedValueOnce(new Error('fail'));

    const { result } = renderHookWithClient(() => useFlaggedSessions());
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('rolls back on mutation error', async () => {
    const sessions: FlaggedSession[] = [
      { id: '1', users: ['a', 'b'], status: 'flagged' },
    ];
    (listFlaggedSessions as jest.Mock).mockResolvedValueOnce(sessions);
    (getActionHistory as jest.Mock).mockResolvedValueOnce([]);
    (applyAction as jest.Mock).mockRejectedValueOnce(new Error('fail'));

    const { result, queryClient } = renderHookWithClient(() => {
      const flagged = useFlaggedSessions();
      const historyMap = useActionHistory(flagged.data ?? []);
      const mutation = useApplyCollusionAction('rev');
      return { flagged, historyMap, mutation };
    });

    await waitFor(() => expect(result.current.flagged.data).toBeDefined());

    await act(async () => {
      await result.current.mutation
        .mutateAsync({ id: '1', status: 'flagged' })
        .catch(() => {});
    });

    const finalSessions = queryClient.getQueryData<FlaggedSession[]>([
      'flagged-sessions',
      't',
    ]);
    const finalHistory = queryClient.getQueryData<ReviewActionLog[]>([
      'collusion-history',
      't',
      '1',
    ]);
    expect(finalSessions?.[0].status).toBe('flagged');
    expect(finalHistory).toEqual([]);
  });
});
