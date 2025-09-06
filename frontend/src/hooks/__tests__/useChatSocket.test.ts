jest.mock('../scheduleTimeout', () => ({
  scheduleTimeout: jest.fn(),
}));

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useChatSocket from '../useChatSocket';
import { scheduleTimeout } from '../scheduleTimeout';

jest.mock('@/lib/env', () => ({ env: { IS_E2E: true } }));

describe('useChatSocket', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('sets timeout once when sending a message', async () => {
    const queryClient = new QueryClient();
    (queryClient as any).cancelQueries = jest.fn();
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient, children });
    const { result } = renderHook(() => useChatSocket(), { wrapper });
    (scheduleTimeout as jest.Mock).mockClear();

    await act(async () => {
      result.current.sendMessage('hello');
    });

    expect(scheduleTimeout).toHaveBeenCalledTimes(1);
  });

  it('sets timeout once when retrying a message', async () => {
    const queryClient = new QueryClient();
    (queryClient as any).cancelQueries = jest.fn();
    queryClient.setQueryData(['chat', 'messages'], [
      { id: 1, text: 'hello', sender: 'player', time: '00:00' },
    ]);
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient, children });
    const { result } = renderHook(() => useChatSocket(), { wrapper });
    (scheduleTimeout as jest.Mock).mockClear();

    await act(async () => {
      result.current.retryMessage(1);
    });

    expect(scheduleTimeout).toHaveBeenCalledTimes(1);
  });
});
