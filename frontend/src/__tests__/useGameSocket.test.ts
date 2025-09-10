import { renderHook, act } from '@testing-library/react';
import useGameSocket from '@/hooks/useGameSocket';
import { getServerTime } from '@/lib/server-time';

const handlers: Record<string, ((...args: any[]) => void)[]> = {};

const socket = {
  on: jest.fn((event: string, handler: (...a: any[]) => void) => {
    handlers[event] = handlers[event] || [];
    handlers[event].push(handler);
  }),
  off: jest.fn((event: string, handler: (...a: any[]) => void) => {
    handlers[event] = (handlers[event] || []).filter((h) => h !== handler);
  }),
  io: { on: jest.fn(), off: jest.fn() },
  disconnect: jest.fn(),
} as any;

const emitWithAck = jest.fn().mockResolvedValue(undefined);

jest.mock('@/lib/socket-core', () => ({
  getSocket: () => socket,
  disconnectSocket: jest.fn(),
  emitWithAck: (...args: any[]) => emitWithAck(...args),
}));

describe('useGameSocket', () => {
  it('sends action and waits for ack', async () => {
    const { result } = renderHook(() => useGameSocket());
    await act(async () => {
      await result.current.sendAction({
        type: 'bet',
        tableId: 't1',
        playerId: 'p1',
        amount: 1,
      });
      await result.current.join();
      await result.current.buyIn();
      await result.current.sitout();
      await result.current.rebuy();
    });
    expect(emitWithAck).toHaveBeenCalledWith(
      'game',
      'action',
      expect.objectContaining({ type: 'bet' }),
      'action:ack',
      1,
      expect.any(Object),
    );
    expect(emitWithAck).toHaveBeenCalledWith(
      'game',
      'join',
      {},
      'join:ack',
      1,
      expect.any(Object),
    );
    expect(emitWithAck).toHaveBeenCalledWith(
      'game',
      'buy-in',
      {},
      'buy-in:ack',
      1,
      expect.any(Object),
    );
    expect(emitWithAck).toHaveBeenCalledWith(
      'game',
      'sitout',
      {},
      'sitout:ack',
      1,
      expect.any(Object),
    );
    expect(emitWithAck).toHaveBeenCalledWith(
      'game',
      'rebuy',
      {},
      'rebuy:ack',
      1,
      expect.any(Object),
    );
  });

  it('updates server time offset on server:Clock', () => {
    const originalNow = Date.now;
    Date.now = () => 1000;
    renderHook(() => useGameSocket());
    handlers['server:Clock']?.forEach((h) => h(5000));
    expect(getServerTime()).toBe(5000);
    Date.now = originalNow;
  });
});
