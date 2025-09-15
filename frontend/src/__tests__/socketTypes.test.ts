import { mockSocketAck } from './helpers/socketAck';
import { getSocket, disconnectSocket } from '@/lib/socket-core';

const { sockets } = mockSocketAck();

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
