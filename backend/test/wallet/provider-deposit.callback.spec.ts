import type { Request } from 'express';
import {
  createWalletWebhookContext,
  signProviderPayload,
} from './test-utils';

describe('Deposit callback', () => {
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

  it('credits account on valid callback and is idempotent', async () => {
    const challenge = await ctx.service.deposit(
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      50,
      'dev1',
      '1.1.1.1',
      'USD',
    );

    const body = {
      eventId: 'evt-body',
      idempotencyKey: 'idem1',
      providerTxnId: challenge.id,
      status: 'approved',
    };
    const req = {
      headers: {
        'x-provider-signature': signProviderPayload(body),
        'x-event-id': 'evt1',
      },
    } as Request;

    await ctx.controller.callback(req, body);

    const journalRepo = ctx.repos.journal;
    const accountRepo = ctx.repos.account;
    expect(await journalRepo.count()).toBe(2);
    const user = await accountRepo.findOneByOrFail({
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    });
    const house = await accountRepo.findOneByOrFail({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    });
    expect(user.balance).toBe(50);
    expect(house.balance).toBe(-50);
    expect(ctx.events.emit).toHaveBeenCalledWith(
      'wallet.credit',
      expect.objectContaining({
        accountId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        amount: 50,
      }),
    );
    expect(ctx.events.emit).toHaveBeenCalledWith(
      'wallet.debit',
      expect.objectContaining({
        accountId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        amount: 50,
      }),
    );

    await ctx.controller.callback(req, body);

    expect(await journalRepo.count()).toBe(2);
    const userAfter = await accountRepo.findOneByOrFail({
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    });
    expect(userAfter.balance).toBe(50);
    expect(ctx.events.emit).toHaveBeenCalledTimes(3);
    expect(ctx.provider.confirm3DS).toHaveBeenCalledTimes(1);
  });
});

