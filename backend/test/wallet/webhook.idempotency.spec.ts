import type { Request } from 'express';
import { WebhookController } from '../../src/wallet/webhook.controller';
import { MockRedis } from '../utils/mock-redis';

describe('WebhookController idempotency', () => {
  it('processes each event only once', async () => {
    const wallet = { confirm3DS: jest.fn().mockResolvedValue(undefined) } as any;
    const provider = {
      registerHandler: jest.fn(),
      drainQueue: jest.fn().mockResolvedValue(undefined),
      verifySignature: jest.fn().mockReturnValue(true),
      confirm3DS: jest.fn(async (payload: unknown) => {
        await wallet.confirm3DS(payload);
      }),
    };
    const redis = new MockRedis();
    const controller = new WebhookController(wallet, provider as any, redis as any);
    const req = {
      headers: {
        'x-provider-signature': 'sig',
        'x-event-id': 'evt1',
      },
    } as unknown as Request;
    const body = { some: 'payload' };

    await controller.callback(req, body);
    await controller.callback(req, body);

    expect(provider.confirm3DS).toHaveBeenCalledTimes(1);
    expect(wallet.confirm3DS).toHaveBeenCalledTimes(1);
  });
});
