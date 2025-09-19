import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTableState } from '@/hooks/useTableState';
import type { TableState } from '@shared/types';
import { fetchTableState } from '@/lib/api/table';
import useSocket from '@/hooks/useSocket';
import { setServerTime } from '@/lib/server-time';

jest.mock('@/hooks/useSocket', () => jest.fn());
jest.mock('@/lib/api/table', () => ({
  fetchTableState: jest.fn(),
}));
jest.mock('@/lib/server-time', () => ({
  setServerTime: jest.fn(),
  getServerTime: jest.fn(() => 0),
}));

type StateListener = (state: TableState) => void;

const mockUseSocket = useSocket as jest.MockedFunction<typeof useSocket>;
const mockFetchTableState = fetchTableState as jest.MockedFunction<
  typeof fetchTableState
>;
const mockSetServerTime = setServerTime as jest.MockedFunction<
  typeof setServerTime
>;

describe('useTableState', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  function createWrapper() {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }
    return { Wrapper, queryClient };
  }

  it('sets server time when fetching initial state', async () => {
    const state: TableState = {
      handId: 'h1',
      seats: [],
      pot: { main: 0, sidePots: [] },
      street: 'pre',
      serverTime: 111,
    };
    mockFetchTableState.mockResolvedValue(state);
    mockUseSocket.mockReturnValue(null as any);
    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useTableState('t1'), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.data).toEqual(state));
    expect(mockSetServerTime).toHaveBeenCalledWith(111);
  });

  it('updates server time when receiving socket events', async () => {
    const initial: TableState = {
      handId: 'h1',
      seats: [],
      pot: { main: 0, sidePots: [] },
      street: 'pre',
      serverTime: 111,
    };
    const live: TableState = {
      handId: 'h2',
      seats: [
        {
          id: 1,
          name: 'Alice',
          avatar: '',
          balance: 100,
          inHand: true,
        },
      ],
      pot: { main: 10, sidePots: [] },
      street: 'flop',
      serverTime: 222,
    };
    const listeners: Record<string, StateListener[]> = {};
    const socket = {
      on: jest.fn((event: string, handler: StateListener) => {
        (listeners[event] ??= []).push(handler);
        return socket;
      }),
      off: jest.fn((event: string, handler: StateListener) => {
        listeners[event] = (listeners[event] ?? []).filter(
          (h) => h !== handler,
        );
        return socket;
      }),
    };

    mockFetchTableState.mockResolvedValue(initial);
    mockUseSocket.mockReturnValue(
      socket as unknown as ReturnType<typeof useSocket>,
    );
    const { Wrapper, queryClient } = createWrapper();

    const { result } = renderHook(() => useTableState('t1'), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.data).toEqual(initial));
    const handler = listeners['state']?.[0];
    expect(handler).toBeDefined();

    act(() => {
      handler?.(live);
    });

    await waitFor(() =>
      expect(queryClient.getQueryData<TableState>(['table', 't1'])).toEqual(
        live,
      ),
    );
    expect(result.current.data).toEqual(live);
    expect(mockSetServerTime).toHaveBeenLastCalledWith(222);
  });
});
