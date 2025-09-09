jest.mock('../scheduleTimeout', () => ({
  scheduleTimeout: jest.fn(),
}));

import { act } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import useChatSocket from '../useChatSocket';
import { renderHookWithClient } from './utils/renderHookWithClient';
import { scheduleTimeout } from '../scheduleTimeout';

jest.mock('@/lib/env', () => ({ env: { IS_E2E: true } }));

function setupHook(messages?: any[]) {
  const queryClient = new QueryClient();
  (queryClient as any).cancelQueries = jest.fn();
  if (messages) {
    queryClient.setQueryData(['chat', 'messages'], messages);
  }
  return renderHookWithClient(() => useChatSocket(), queryClient).result;
}

describe('useChatSocket', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('sets timeout once when sending a message', async () => {
    const { result } = setupHook();
    (scheduleTimeout as jest.Mock).mockClear();

    await act(async () => {
      result.current.sendMessage('hello');
    });

    expect(scheduleTimeout).toHaveBeenCalledTimes(1);
  });

  it('sets timeout once when retrying a message', async () => {
    const { result } = setupHook([
      { id: 1, text: 'hello', sender: 'player', time: '00:00' },
    ]);
    (scheduleTimeout as jest.Mock).mockClear();

    await act(async () => {
      result.current.retryMessage(1);
    });

    expect(scheduleTimeout).toHaveBeenCalledTimes(1);
  });
});
