import fc from 'fast-check';
import { writeHandLedger } from '../src/wallet/hand-ledger';
import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import { randomUUID } from 'crypto';
import { Account } from '../src/wallet/account.entity';
import { JournalEntry } from '../src/wallet/journal-entry.entity';
import { Disbursement } from '../src/wallet/disbursement.entity';
import { WalletService } from '../src/wallet/wallet.service';
import { EventPublisher } from '../src/events/events.service';
import { PaymentProviderService } from '../src/wallet/payment-provider.service';
import { KycService } from '../src/wallet/kyc.service';
import { SettlementJournal } from '../src/wallet/settlement-journal.entity';
import type { Street } from '../src/game/state-machine';
import { MockRedis } from './utils/mock-redis';

jest.setTimeout(20000);

interface SettlementEntry {
  playerId: string;
  delta: number;
}

describe('hand ledger journal property', () => {
  const playerIds = [
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
  ];
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
      entities: [Account, JournalEntry, Disbursement, SettlementJournal],
      synchronize: true,
    }) as DataSource;
    await dataSource.initialize();
    const accountRepo = dataSource.getRepository(Account);
    const journalRepo = dataSource.getRepository(JournalEntry);
    const disbRepo = dataSource.getRepository(Disbursement);
    const settleRepo = dataSource.getRepository(SettlementJournal);
    const redis = new MockRedis();
    const provider = { initiate3DS: jest.fn(), getStatus: jest.fn() } as unknown as PaymentProviderService;
    const kyc = { validate: jest.fn().mockResolvedValue(undefined) } as unknown as KycService;
    const service = new WalletService(
      accountRepo,
      journalRepo,
      disbRepo,
      settleRepo,
      events,
      redis,
      provider,
      kyc,
    );
    (service as any).enqueueDisbursement = jest.fn();
    await accountRepo.save([
      { id: playerIds[0], name: 'p1', balance: 0, currency: 'USD' },
      { id: playerIds[1], name: 'p2', balance: 0, currency: 'USD' },
      { id: playerIds[2], name: 'p3', balance: 0, currency: 'USD' },
      { id: '00000000-0000-0000-0000-000000000004', name: 'reserve', balance: 0, currency: 'USD' },
      { id: '00000000-0000-0000-0000-000000000005', name: 'prize', balance: 0, currency: 'USD' },
      { id: '00000000-0000-0000-0000-000000000006', name: 'rake', balance: 0, currency: 'USD' },
    ]);
    return { dataSource, service, journalRepo };
  }

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
      settlements.push({ playerId: 'winner', delta: total });
      return settlements as SettlementEntry[];
    });

  it('journal deltas sum to zero after random hand ledger batches', async () => {
    const batchesArb = fc.array(settlementBatchArb, { maxLength: 5 });
    await fc.assert(
      fc.asyncProperty(batchesArb, async (batches) => {
        const { dataSource, service, journalRepo } = await setup();
        try {
          for (const settlements of batches) {
            const key = randomUUID();
            await writeHandLedger(service, key, 'river' as Street, 0, settlements);
            const entries = await journalRepo.find();
            const total = entries.reduce((sum, e) => sum + Number(e.amount), 0);
            expect(total).toBe(0);
          }
        } finally {
          await dataSource.destroy();
        }
      }),
      { numRuns: 25 },
    );
  });
});

