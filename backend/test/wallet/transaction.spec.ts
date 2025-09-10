import { Account } from '../../src/wallet/account.entity';
import { JournalEntry } from '../../src/wallet/journal-entry.entity';
import { WalletService } from '../../src/wallet/wallet.service';
import { EventPublisher } from '../../src/events/events.service';
import { setupWalletTest, WalletTestContext } from './test-utils';

describe('WalletService transactions', () => {
  let ctx: WalletTestContext;
  let service: WalletService;
  let events: EventPublisher;

  beforeAll(async () => {
    ctx = await setupWalletTest();
    service = ctx.service;
    events = ctx.events;
    await ctx.repos.account.save([
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'user',
        balance: 1000,
        currency: 'USD',
      },
      {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'reserve',
        balance: 0,
        currency: 'USD',
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'house',
        balance: 0,
        currency: 'USD',
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        name: 'rake',
        balance: 0,
        currency: 'USD',
      },
      {
        id: '00000000-0000-0000-0000-000000000004',
        name: 'prize',
        balance: 0,
        currency: 'USD',
      },
    ]);
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
    const accounts = await ctx.repos.account.find();
    const user = accounts.find(
      (a) => a.id === '11111111-1111-1111-1111-111111111111',
    );
    const reserve = accounts.find((a) => a.name === 'reserve');
    const prize = accounts.find((a) => a.name === 'prize');
    const rake = accounts.find((a) => a.name === 'rake');
    expect(user?.balance).toBe(900);
    expect(reserve?.balance).toBe(0);
    expect(prize?.balance).toBe(95);
    expect(rake?.balance).toBe(5);
    const journals = await ctx.repos.journal.find();
    expect(journals).toHaveLength(5); // reserve 2 entries + commit 3 entries
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
    const user = await ctx.repos.account.findOneBy({
      id: '11111111-1111-1111-1111-111111111111',
    });
    const reserve = await ctx.repos.account.findOneBy({ name: 'reserve' });
    expect(user?.balance).toBe(900);
    expect(reserve?.balance).toBe(0);
  });
});
