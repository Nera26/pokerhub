import { createWalletWebhookContext } from './test-utils';
import { makeProviderRequest, paymentIntentSucceeded } from './provider.test-utils';

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

  const cases = [
    {
      name: 'processes valid callback and is idempotent',
      makeReq: (body: unknown) => makeProviderRequest(body),
      expectError: false,
    },
    {
      name: 'rejects invalid signatures',
      makeReq: (body: unknown) => makeProviderRequest(body, 'bad'),
      expectError: true,
    },
  ] as const;

  it.each(cases)('$name', async ({ makeReq, expectError }) => {
    const challenge = await ctx.service.deposit(
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      50,
      'dev1',
      '1.1.1.1',
      'USD',
    );
    const body = paymentIntentSucceeded(challenge.id);
    const req = makeReq(body);

    if (expectError) {
      await expect(ctx.controller.callback(req, body)).rejects.toThrow(
        'invalid signature',
      );
      return;
    }

    await ctx.controller.callback(req, body);
    const journalRepo = ctx.repos.journal;
    const accountRepo = ctx.repos.account;
    expect(await journalRepo.count()).toBe(2);
    const entries = await journalRepo.find();
    expect(entries[0].providerTxnId).toBe(challenge.id);
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

