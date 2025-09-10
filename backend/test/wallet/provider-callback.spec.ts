import type { Request } from 'express';
import { createWalletWebhookContext, signProviderPayload } from './test-utils';

describe('Provider webhook', () => {
  let ctx: Awaited<ReturnType<typeof createWalletWebhookContext>>;

  beforeAll(async () => {
    process.env.PROVIDER_WEBHOOK_SECRET = 'shhh';
    ctx = await createWalletWebhookContext();
  });

  beforeEach(async () => {
    const { account, journal, disbursement } = ctx.repos;
    await journal.createQueryBuilder().delete().execute();
    await disbursement.createQueryBuilder().delete().execute();
    await account.createQueryBuilder().delete().execute();
    await account.save([
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        name: 'house',
        balance: 0,
        kycVerified: false,
        currency: 'USD',
      },
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        name: 'user',
        balance: 0,
        kycVerified: true,
        currency: 'USD',
      },
    ]);
  });

  afterAll(async () => {
    await ctx.dataSource.destroy();
  });

  it('validates signature and updates journal exactly once', async () => {
    const challenge = await ctx.service.deposit(
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      50,
      'dev1',
      '1.1.1.1',
      'USD',
    );
    const body = {
      id: 'evt1',
      type: 'payment_intent.succeeded',
      data: { object: { id: challenge.id, status: 'succeeded' } },
    };
    const sig = signProviderPayload(body);
    const req = {
      headers: { 'x-provider-signature': sig, 'x-event-id': 'evt1' },
    } as Request;
    await ctx.controller.callback(req, body);
    const entries = await ctx.repos.journal.find();
    expect(entries).toHaveLength(2);
    expect(entries[0].providerTxnId).toBe(challenge.id);
    await ctx.controller.callback(req, body);
    expect(await ctx.repos.journal.count()).toBe(2);
  });

  it('rejects invalid signatures', async () => {
    const challenge = await ctx.service.deposit(
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      50,
      'dev1',
      '1.1.1.1',
      'USD',
    );
    const body = {
      id: 'evt1',
      type: 'payment_intent.succeeded',
      data: { object: { id: challenge.id, status: 'succeeded' } },
    };
    const req = {
      headers: { 'x-provider-signature': 'bad', 'x-event-id': 'evt1' },
    } as Request;
    await expect(ctx.controller.callback(req, body)).rejects.toThrow(
      'invalid signature',
    );
  });
});

