import { writeHandLedger } from '../../src/wallet/hand-ledger';
import { setupTestWallet } from '../../src/wallet/test-utils';
import type { Street } from '../../src/game/state-machine';

describe('hand ledger integration', () => {
  it('persists journal entries for settlements', async () => {
    const { service, dataSource, repos } = await setupTestWallet({ mockLedger: false });
    await repos.account.save({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      name: 'loser',
      currency: 'USD',
      balance: 100,
    });
    await repos.account.save({
      id: '11111111-1111-1111-1111-111111111111',
      name: 'reserve',
      currency: 'USD',
    });
    await repos.account.save({
      id: '22222222-2222-2222-2222-222222222222',
      name: 'prize',
      currency: 'USD',
    });
    await repos.account.save({
      id: '33333333-3333-3333-3333-333333333333',
      name: 'rake',
      currency: 'USD',
    });

    const settlements = [
      { playerId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', delta: -50 },
      { playerId: 'winner', delta: 50 },
    ];

    await writeHandLedger(
      service,
      dataSource,
      'hand1',
      'river' as Street,
      0,
      settlements,
      'USD',
    );

    const rows = await repos.journal.find({ where: { refId: 'hand1#river#0' } });
    expect(rows).toHaveLength(5);
  });
});
