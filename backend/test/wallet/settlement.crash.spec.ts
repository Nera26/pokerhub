import type { Street } from '../../src/game/state-machine';
import {
  setupWalletTest,
  WalletTestContext,
  createWalletServices,
  expectLedgerBalances,
} from './test-utils';
import { walletAccounts } from './fixtures';

describe('Settlement crash recovery', () => {
  const userId = '11111111-1111-1111-1111-111111111111';
  const street: Street = 'flop';
  let ctx: WalletTestContext;

  beforeEach(async () => {
    ctx = await setupWalletTest();
    await ctx.repos.account.save(walletAccounts);
  });

  afterEach(async () => {
    await ctx.dataSource.destroy();
  });

  it('retries commit after crash without double settlement', async () => {
    const tx = 'h1#flop#1';
    const idem = tx;
    await ctx.service.reserve(userId, 100, tx, 'USD', idem);

    // simulate crash by creating new service instances
    const { service: wallet2, settleSvc: settle2 } = createWalletServices(
      ctx.dataSource,
    );

    await settle2.commit('h1', street, 1);
    await settle2.commit('h1', street, 1);
    await wallet2.commit(tx, 100, 5, 'USD', idem);
    await wallet2.commit(tx, 100, 5, 'USD', idem);

    await expectLedgerBalances(ctx.repos, {
      user: 900,
      reserve: 0,
      prize: 95,
      rake: 5,
      journals: 5,
      total: 1000,
    });
    const entry = await ctx.repos.settlement.findOneByOrFail({
      idempotencyKey: idem,
    });
    expect(entry.status).toBe('committed');
  });

  it('retries cancel after crash without double settlement', async () => {
    const tx = 'h2#flop#1';
    const idem = tx;
    await ctx.service.reserve(userId, 100, tx, 'USD', idem);

    const { service: wallet2, settleSvc: settle2 } = createWalletServices(
      ctx.dataSource,
    );
    await settle2.cancel('h2', street, 1);
    await settle2.cancel('h2', street, 1);
    await wallet2.rollback(userId, 100, tx, 'USD', idem);
    await wallet2.rollback(userId, 100, tx, 'USD', idem);

    await expectLedgerBalances(ctx.repos, {
      user: 1000,
      reserve: 0,
      prize: 0,
      rake: 0,
      journals: 4,
      total: 1000,
    });
    const entries = await ctx.repos.settlement.find();
    expect(entries).toHaveLength(0);
  });
});

