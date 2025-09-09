import { renderHook } from '@testing-library/react';
import useSocket from '../useSocket';

const socket = { io: { on: jest.fn(), off: jest.fn() } } as any;
const getSocket = jest.fn(() => socket);
const disconnectSocket = jest.fn();

jest.mock('../../app/utils/socket', () => ({
  getSocket: (...args: any[]) => getSocket(...args),
  disconnectSocket: (...args: any[]) => disconnectSocket(...args),
}));

describe('useSocket', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('connects and disconnects to chat namespace', () => {
    const { unmount } = renderHook(() => useSocket('chat'));
    expect(getSocket).toHaveBeenCalledWith({ namespace: 'chat' });
    unmount();
    expect(disconnectSocket).toHaveBeenCalledWith('chat');
  });

  it('connects and disconnects to game namespace', () => {
    const { unmount } = renderHook(() => useSocket('game'));
    expect(getSocket).toHaveBeenCalledWith({ namespace: 'game' });
    unmount();
    expect(disconnectSocket).toHaveBeenCalledWith('game');
  });
});
