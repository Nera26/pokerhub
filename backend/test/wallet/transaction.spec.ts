import { WalletService } from '../../src/wallet/wallet.service';
import { EventPublisher } from '../../src/events/events.service';
import {
  setupWalletTest,
  WalletTestContext,
  expectLedgerBalances,
} from './test-utils';
import { walletAccounts } from './fixtures';

describe('WalletService transactions', () => {
  let ctx: WalletTestContext;
  let service: WalletService;
  let events: EventPublisher;

  beforeAll(async () => {
    ctx = await setupWalletTest();
    service = ctx.service;
    events = ctx.events;
    await ctx.repos.account.save(walletAccounts);
  });

  afterAll(async () => {
    await ctx.dataSource.destroy();
  });

  it('reserves and commits funds with rake and idempotency', async () => {
    const tx = 'hand1#flop#1';
    await service.reserve('11111111-1111-1111-1111-111111111111', 100, tx, 'USD');
    await service.commit(tx, 100, 5, 'USD');
    // duplicate commit should be ignored
    await service.commit(tx, 100, 5, 'USD');
    const { journals } = await expectLedgerBalances(ctx.repos, {
      user: 900,
      reserve: 0,
      prize: 95,
      rake: 5,
      journals: 5, // reserve 2 entries + commit 3 entries
      total: 1000,
    });
    expect(journals.every((j) => j.currency === 'USD')).toBe(true);
    expect(
      (events.emit as any).mock.calls.some(
        (c: any[]) => c[0] === 'wallet.debit',
      ),
    ).toBe(true);
    expect(
      (events.emit as any).mock.calls.some(
        (c: any[]) => c[0] === 'wallet.credit',
      ),
    ).toBe(true);
  });

  it('rolls back reservation', async () => {
    const tx = 'hand2#flop#1';
    await service.reserve('11111111-1111-1111-1111-111111111111', 50, tx, 'USD');
    await service.rollback('11111111-1111-1111-1111-111111111111', 50, tx, 'USD');
    await expectLedgerBalances(ctx.repos, {
      user: 900,
      reserve: 0,
      prize: 95,
      rake: 5,
      journals: 9,
      total: 1000,
    });
  });
});
