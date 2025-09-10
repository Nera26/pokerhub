import { createWalletTestContext } from './test-utils';

describe('WalletService history', () => {
  let ctx: Awaited<ReturnType<typeof createWalletTestContext>>;

  beforeAll(async () => {
    ctx = await createWalletTestContext();
    await ctx.repos.account.save({
      id: '11111111-1111-1111-1111-111111111111',
      name: 'user',
      balance: 0,
      kycVerified: true,
      currency: 'USD',
    });
    await ctx.repos.journal.save({
      id: '22222222-2222-2222-2222-222222222222',
      accountId: '11111111-1111-1111-1111-111111111111',
      account: { id: '11111111-1111-1111-1111-111111111111' } as any,
      amount: 100,
      currency: 'USD',
      refType: 'deposit',
      refId: 'r1',
      hash: 'h1',
    });
    await ctx.repos.disbursement.save({
      id: '33333333-3333-3333-3333-333333333333',
      accountId: '11111111-1111-1111-1111-111111111111',
      amount: 50,
      idempotencyKey: 'k1',
      status: 'pending',
    });
  });

  afterAll(async () => {
    await ctx.dataSource.destroy();
  });

  it('returns ledger transactions', async () => {
    const res = await ctx.service.transactions(
      '11111111-1111-1111-1111-111111111111',
    );
    expect(res.transactions).toHaveLength(1);
    expect(res.transactions[0]).toMatchObject({
      id: '22222222-2222-2222-2222-222222222222',
      type: 'deposit',
      amount: 100,
      currency: 'USD',
    });
  });

  it('returns pending disbursements', async () => {
    const res = await ctx.service.pending(
      '11111111-1111-1111-1111-111111111111',
    );
    expect(res.transactions).toHaveLength(1);
    expect(res.transactions[0]).toMatchObject({
      id: '33333333-3333-3333-3333-333333333333',
      amount: 50,
      status: 'pending',
    });
  });
});

