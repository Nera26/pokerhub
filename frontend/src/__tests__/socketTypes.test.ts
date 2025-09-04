import { getSocket, disconnectSocket } from '@/app/utils/socket';

const sockets: any[] = [];

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => {
    const socket = {
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      io: { on: jest.fn(), off: jest.fn() },
      disconnect: jest.fn(),
    };
    sockets.push(socket);
    return socket;
  }),
}));

describe('socket type safety', () => {
  afterEach(() => {
    disconnectSocket();
    sockets.length = 0;
    jest.clearAllMocks();
  });

  it('allows valid handlers and payloads', () => {
    const sock = getSocket();
    sock.on('connect', () => {});
    sock.emit('frame:ack', { frameId: 'abc' });
  });

  it('rejects invalid handlers and events', () => {
    const sock = getSocket();
    // @ts-expect-error unknown event name
    sock.on('unknown', () => {});
    // @ts-expect-error handler has wrong signature
    sock.on('connect', (id: string) => {});
    // @ts-expect-error payload missing frameId
    sock.emit('frame:ack', { foo: 'bar' });
  });
});
