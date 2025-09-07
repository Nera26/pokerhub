import { describe, it, expect, afterEach, jest } from '@jest/globals';

afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

describe('getSocket URL resolution', () => {
  it('prefers NEXT_PUBLIC_SOCKET_URL when provided', async () => {
    const ioMock = jest.fn(() => ({
      on: jest.fn(),
      off: jest.fn(),
      once: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
      io: { on: jest.fn(), off: jest.fn() },
    }));
    const getBaseUrlMock = jest.fn(() => 'http://base');

    jest.doMock('socket.io-client', () => ({ io: ioMock }));
    jest.doMock('@/lib/base-url', () => ({ getBaseUrl: getBaseUrlMock }));
    jest.doMock('@/lib/env', () => ({ env: { NEXT_PUBLIC_SOCKET_URL: 'http://override', IS_E2E: false } }));

    const { getSocket } = await import('../socket');
    getSocket();

    expect(ioMock).toHaveBeenCalledWith('http://override', expect.any(Object));
    expect(getBaseUrlMock).not.toHaveBeenCalled();
  });

  it('falls back to getBaseUrl when NEXT_PUBLIC_SOCKET_URL is missing', async () => {
    const ioMock = jest.fn(() => ({
      on: jest.fn(),
      off: jest.fn(),
      once: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
      io: { on: jest.fn(), off: jest.fn() },
    }));
    const getBaseUrlMock = jest.fn(() => 'http://base');

    jest.doMock('socket.io-client', () => ({ io: ioMock }));
    jest.doMock('@/lib/base-url', () => ({ getBaseUrl: getBaseUrlMock }));
    jest.doMock('@/lib/env', () => ({ env: { IS_E2E: false } }));

    const { getSocket } = await import('../socket');
    getSocket();

    expect(getBaseUrlMock).toHaveBeenCalled();
    expect(ioMock).toHaveBeenCalledWith('ws://base', expect.any(Object));
  });
});

