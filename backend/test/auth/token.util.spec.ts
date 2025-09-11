import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import type { Socket } from 'socket.io';
import { extractBearerToken } from '../../src/auth/token.util';

describe('extractBearerToken', () => {
  const makeHttpContext = (authorization?: string): ExecutionContext =>
    ({
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => ({ headers: authorization ? { authorization } : {} }),
      }),
    }) as any;

  const makeWsContext = (authorization?: string): ExecutionContext =>
    ({
      getType: () => 'ws',
      switchToWs: () => ({
        getClient: () =>
          ({
            handshake: { headers: authorization ? { authorization } : {} },
          }) as Socket,
      }),
    }) as any;

  it('extracts token from HTTP context', () => {
    const ctx = makeHttpContext('Bearer http-token');
    expect(extractBearerToken(ctx)).toBe('http-token');
  });

  it('extracts token from WS context', () => {
    const ctx = makeWsContext('Bearer ws-token');
    expect(extractBearerToken(ctx)).toBe('ws-token');
  });

  it('throws for missing or malformed HTTP header', () => {
    const ctx = makeHttpContext('Token');
    expect(() => extractBearerToken(ctx)).toThrow(UnauthorizedException);
  });

  it('throws for missing or malformed WS header', () => {
    const ctx = makeWsContext();
    expect(() => extractBearerToken(ctx)).toThrow(UnauthorizedException);
  });
});
