import fc from 'fast-check';
import { randomUUID } from 'crypto';
import { strict as assert } from 'assert';
import { writeHandLedger } from '../../src/wallet/hand-ledger';
import type { Street } from '../../src/game/state-machine';
import { Account } from '../../src/wallet/account.entity';
import { JournalEntry } from '../../src/wallet/journal-entry.entity';
import { setupWalletTest } from './test-utils';

jest.setTimeout(20000);

describe('WalletService ledger properties', () => {
  async function setup() {
    const ctx = await setupWalletTest();
    const {
      dataSource,
      service,
      repos: { account: accountRepo, journal: journalRepo },
    } = ctx;
    const accounts = await accountRepo.save([
      {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'a',
        balance: 0,
        currency: 'USD',
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'b',
        balance: 0,
        currency: 'USD',
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        name: 'c',
        balance: 0,
        currency: 'USD',
      },
    ]);
    return { dataSource, service, accounts, journalRepo };
  }

  const transferArb = fc
    .record({
      from: fc.integer({ min: 0, max: 2 }),
      to: fc.integer({ min: 0, max: 2 }),
      amount: fc.integer({ min: 1, max: 100 }),
    })
    .filter((op) => op.from !== op.to);

  it('maintains zero total balance after each batch', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(transferArb, { maxLength: 10 }), async (ops) => {
        const { dataSource, service, accounts } = await setup();
        try {
          for (let i = 0; i < ops.length; i++) {
            const { from, to, amount } = ops[i];
            await (service as any).record('test', `${i}`, [
              { account: accounts[from], amount: -amount },
              { account: accounts[to], amount: amount },
            ]);
            const total = accounts.reduce((sum, acc) => sum + acc.balance, 0);
            expect(total).toBe(0);
          }
        } finally {
          await dataSource.destroy();
        }
      }),
      { numRuns: 25 },
    );
  });

  const playerIds = [
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
  ];

  const settlementBatchArb = fc
    .array(
      fc.record({
        player: fc.integer({ min: 0, max: playerIds.length - 1 }),
        amount: fc.integer({ min: 1, max: 100 }),
      }),
      { minLength: 1, maxLength: playerIds.length },
    )
    .map((losses) => {
      const total = losses.reduce((s, l) => s + l.amount, 0);
      const settlements = losses.map((l) => ({
        playerId: playerIds[l.player],
        delta: -l.amount,
      }));
      settlements.push({
        playerId: '00000000-0000-0000-0000-000000000010',
        delta: total,
      });
      return settlements as { playerId: string; delta: number }[];
    });

  function normalize(entries: JournalEntry[]) {
    return entries
      .map((e) => ({
        account: e.accountId,
        amount: Number(e.amount),
        ref: `${e.refType}:${e.refId}`,
      }))
      .sort(
        (a, b) =>
          a.ref.localeCompare(b.ref) ||
          a.account.localeCompare(b.account) ||
          a.amount - b.amount,
      );
  }

  async function setupHand() {
    const { dataSource, service, journalRepo } = await setup();
    const accountRepo = dataSource.getRepository(Account);
    await accountRepo.save([
      {
        id: '00000000-0000-0000-0000-000000000010',
        name: 'winner',
        balance: 0,
        currency: 'USD',
      },
      {
        id: '00000000-0000-0000-0000-000000000004',
        name: 'reserve',
        balance: 0,
        currency: 'USD',
      },
      {
        id: '00000000-0000-0000-0000-000000000005',
        name: 'prize',
        balance: 0,
        currency: 'USD',
      },
      {
        id: '00000000-0000-0000-0000-000000000006',
        name: 'rake',
        balance: 0,
        currency: 'USD',
      },
    ]);
    return { dataSource, service, journalRepo };
  }

  it('hand logs are replayable', async () => {
    await fc.assert(
      fc.asyncProperty(settlementBatchArb, async (settlements) => {
        const { dataSource, service, journalRepo } = await setupHand();
        try {
          const handId = randomUUID();
          await writeHandLedger(
            service,
            dataSource,
            handId,
            'river' as Street,
            0,
            settlements,
            'USD',
          );
          const original = normalize(await journalRepo.find());
          const { dataSource: ds2, service: service2, journalRepo: jr2 } = await setupHand();
          try {
            await writeHandLedger(
              service2,
              ds2,
              handId,
              'river' as Street,
              0,
              settlements,
              'USD',
            );
            const replayed = normalize(await jr2.find());
            assert.deepStrictEqual(replayed, original);
          } finally {
            await ds2.destroy();
          }
        } finally {
          await dataSource.destroy();
        }
      }),
      { numRuns: 25 },
    );
  });
});

