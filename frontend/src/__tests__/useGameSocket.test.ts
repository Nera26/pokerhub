import { renderHook, act } from '@testing-library/react';
import useGameSocket from '@/hooks/useGameSocket';

const handlers: Record<string, ((...args: any[]) => void)[]> = {};

const socket = {
  on: jest.fn((event: string, handler: (...a: any[]) => void) => {
    handlers[event] = handlers[event] || [];
    handlers[event].push(handler);
  }),
  off: jest.fn((event: string, handler: (...a: any[]) => void) => {
    handlers[event] = (handlers[event] || []).filter((h) => h !== handler);
  }),
  emit: jest.fn((event: string, payload?: any) => {
    setTimeout(() => {
      const ackEvent = `${event}:ack`;
      handlers[ackEvent]?.forEach((h) => h({ actionId: payload?.actionId }));
    }, 0);
  }),
  io: { on: jest.fn(), off: jest.fn() },
  disconnect: jest.fn(),
} as any;

jest.mock('@/app/utils/socket', () => ({
  getSocket: () => socket,
  disconnectSocket: jest.fn(),
}));

describe('useGameSocket', () => {
  it('sends action and waits for ack', async () => {
    const { result } = renderHook(() => useGameSocket());
    await act(async () => {
      await result.current.sendAction({ type: 'bet' });
      await result.current.join();
      await result.current.buyIn();
      await result.current.sitout();
      await result.current.rebuy();
    });
    expect(socket.emit).toHaveBeenCalledWith(
      'action',
      expect.objectContaining({ type: 'bet', actionId: expect.any(String) }),
    );
    expect(socket.emit).toHaveBeenCalledWith('join', expect.any(Object));
    expect(socket.emit).toHaveBeenCalledWith('buy-in', expect.any(Object));
    expect(socket.emit).toHaveBeenCalledWith('sitout', expect.any(Object));
    expect(socket.emit).toHaveBeenCalledWith('rebuy', expect.any(Object));
  });
});

