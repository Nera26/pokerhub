const sockets: any[] = [];
const packetHandlers: ((packet: any) => void)[] = [];

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => {
    const socket = {
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      io: {
        on: jest.fn((event: string, handler: any) => {
          if (event === 'packet') packetHandlers.push(handler);
        }),
        off: jest.fn(),
      },
      disconnect: jest.fn(),
    };
    sockets.push(socket);
    return socket;
  }),
}));

export function mockSocketAck() {
  return { sockets, packetHandlers };
}
