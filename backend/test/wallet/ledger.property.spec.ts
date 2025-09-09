import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import fc from 'fast-check';
import { randomUUID } from 'crypto';
import { strict as assert } from 'assert';
import { Account } from '../../src/wallet/account.entity';
import { JournalEntry } from '../../src/wallet/journal-entry.entity';
import { Disbursement } from '../../src/wallet/disbursement.entity';
import { SettlementJournal } from '../../src/wallet/settlement-journal.entity';
import { PendingDeposit } from '../../src/wallet/pending-deposit.entity';
import { WalletService } from '../../src/wallet/wallet.service';
import { EventPublisher } from '../../src/events/events.service';
import { PaymentProviderService } from '../../src/wallet/payment-provider.service';
import { KycService } from '../../src/wallet/kyc.service';
import { SettlementService } from '../../src/wallet/settlement.service';
import { writeHandLedger } from '../../src/wallet/hand-ledger';
import type { Street } from '../../src/game/state-machine';
import { MockRedis } from '../utils/mock-redis';

jest.setTimeout(20000);

describe('WalletService ledger properties', () => {
  const events: EventPublisher = { emit: jest.fn() } as any;

  async function setup() {
    const db = newDb();
    db.public.registerFunction({
      name: 'version',
      returns: 'text',
      implementation: () => 'pg-mem',
    });
    db.public.registerFunction({
      name: 'current_database',
      returns: 'text',
      implementation: () => 'test',
    });
    let seq = 1;
    db.public.registerFunction({
      name: 'uuid_generate_v4',
      returns: 'text',
      implementation: () => {
        const id = seq.toString(16).padStart(32, '0');
        seq++;
        return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;
      },
    });
    const dataSource = db.adapters.createTypeormDataSource({
      type: 'postgres',
      entities: [
        Account,
        JournalEntry,
        Disbursement,
        SettlementJournal,
        PendingDeposit,
      ],
      synchronize: true,
    }) as DataSource;
    await dataSource.initialize();
    const accountRepo = dataSource.getRepository(Account);
    const journalRepo = dataSource.getRepository(JournalEntry);
    const disbRepo = dataSource.getRepository(Disbursement);
    const settleRepo = dataSource.getRepository(SettlementJournal);
    const pendingRepo = dataSource.getRepository(PendingDeposit);
    const redis = new MockRedis();
    const provider = { initiate3DS: jest.fn(), getStatus: jest.fn() } as unknown as PaymentProviderService;
    const kyc = {
      validate: jest.fn().mockResolvedValue(undefined),
      isVerified: jest.fn().mockResolvedValue(true),
    } as unknown as KycService;
    const settlementSvc = {
      reserve: jest.fn(),
      commit: jest.fn(),
      cancel: jest.fn(),
    } as unknown as SettlementService;
    const service = new WalletService(
      accountRepo,
      journalRepo,
      disbRepo,
      settleRepo,
      pendingRepo,
      events,
      redis,
      provider,
      kyc,
      settlementSvc,
    );
    (service as any).enqueueDisbursement = jest.fn();

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

