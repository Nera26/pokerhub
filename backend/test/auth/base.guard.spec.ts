/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import type { ExecutionContext } from '@nestjs/common';
import type { Socket } from 'socket.io';
import { BaseAuthGuard } from '../../src/auth/base.guard';

describe('BaseAuthGuard', () => {
  class TestGuard extends BaseAuthGuard {
    constructor(private readonly uid: string) {
      super();
    }
    protected validate(token: string) {
      expect(token).toBe('test-token');
      return { userId: this.uid };
    }
  }

  const makeHttpContext = () => {
    const req: any = { headers: { authorization: 'Bearer test-token' } };
    const ctx = {
      getType: () => 'http',
      switchToHttp: () => ({ getRequest: () => req }),
    } as ExecutionContext;
    return { ctx, req };
  };

  const makeWsContext = () => {
    const client: any = {
      handshake: { headers: { authorization: 'Bearer test-token' } },
      data: {},
    };
    const ctx = {
      getType: () => 'ws',
      switchToWs: () => ({ getClient: () => client as Socket }),
    } as ExecutionContext;
    return { ctx, client };
  };

  it('attaches userId to HTTP request', async () => {
    const guard = new TestGuard('user-123');
    const { ctx, req } = makeHttpContext();
    await guard.canActivate(ctx);
    expect(req.userId).toBe('user-123');
  });

  it('attaches userId to WS client', async () => {
    const guard = new TestGuard('user-456');
    const { ctx, client } = makeWsContext();
    await guard.canActivate(ctx);
    expect(client.data.userId).toBe('user-456');
  });
});
