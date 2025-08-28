import { getSocket, disconnectSocket } from '@/app/utils/socket';
import { io as ioClient } from 'socket.io-client';

const on = jest.fn();
const disconnect = jest.fn();

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({ on, disconnect })),
}));

describe('socket utils', () => {
  afterEach(() => {
    disconnectSocket();
    jest.clearAllMocks();
  });

  it('disconnects and clears cached socket', () => {
    const first = getSocket();
    expect(first).toBeDefined();
    disconnectSocket();
    expect(disconnect).toHaveBeenCalled();
    const second = getSocket();
    // io should be called twice: once for first getSocket, once after disconnect
    expect(ioClient).toHaveBeenCalledTimes(2);
    expect(second).not.toBe(first);
  });

  it('creates namespaced socket', () => {
    const gameSocket = getSocket({ namespace: 'game' });
    expect(gameSocket).toBeDefined();
    expect((ioClient as jest.Mock).mock.calls[0][0]).toContain('/game');
    disconnectSocket('game');
  });
});
