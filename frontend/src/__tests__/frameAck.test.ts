import { mockSocketAck } from './helpers/socketAck';
import { getSocket, disconnectSocket } from '@/lib/socket-core';

const { sockets, packetHandlers } = mockSocketAck();

describe('frame acknowledgement', () => {
  afterEach(() => {
    disconnectSocket();
    disconnectSocket('game');
    sockets.length = 0;
    packetHandlers.length = 0;
    jest.clearAllMocks();
  });

  it('emits frame:ack for default namespace', () => {
    const sock = getSocket();
    const handler = packetHandlers[0];
    handler({ nsp: '/', data: ['event', { frameId: 'abc' }] });
    expect(sock.emit).toHaveBeenCalledWith('frame:ack', { frameId: 'abc' });
  });

  it('emits frame:ack for named namespace', () => {
    getSocket();
    const gameSock = getSocket({ namespace: 'game' });
    const handler = packetHandlers[0];
    handler({ nsp: '/game', data: ['event', { frameId: 'f1' }] });
    expect(gameSock.emit).toHaveBeenCalledWith('frame:ack', { frameId: 'f1' });
  });
});
