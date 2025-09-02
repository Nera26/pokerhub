import { DataSource } from 'typeorm';
import { newDb } from 'pg-mem';
import * as fc from 'fast-check';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { strict as assert } from 'assert';
import { Account } from '../src/wallet/account.entity';
import { JournalEntry } from '../src/wallet/journal-entry.entity';
import { Disbursement } from '../src/wallet/disbursement.entity';
import { SettlementJournal } from '../src/wallet/settlement-journal.entity';
import { WalletService } from '../src/wallet/wallet.service';
import { PaymentProviderService } from '../src/wallet/payment-provider.service';
import { KycService } from '../src/wallet/kyc.service';
import { SettlementService } from '../src/wallet/settlement.service';
import { MockRedis } from './utils/mock-redis';
import { writeHandLedger } from '../src/wallet/hand-ledger';
import type { Street } from '../src/game/state-machine';
import { EventPublisher } from '../src/events/events.service';
import type { Redis } from 'ioredis';

interface BatchEntry {
  account: number;
  delta: number;
}

interface HandLog {
  handId: string;
  settlements: { playerId: string; delta: number }[];
}

const events = {
  emit: async () => undefined,
  onModuleDestroy: async () => undefined,
} as unknown as EventPublisher;

async function writeFailure(data: unknown) {
  const dir = path.join(__dirname, '../../../storage');
  await fs.mkdir(dir, { recursive: true });
  const today = new Date().toISOString().slice(0, 10);
  const file = path.join(dir, `reconcile-${today}.json`);
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

async function setup() {
  const db = newDb();
  db.public.registerFunction({
    name: 'version',
    returns: 'text' as any,
    implementation: () => 'pg-mem',
  });
  db.public.registerFunction({
    name: 'current_database',
    returns: 'text' as any,
    implementation: () => 'test',
  });
  let seq = 1;
  db.public.registerFunction({
    name: 'uuid_generate_v4',
    returns: 'text' as any,
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
  const redis = new MockRedis() as unknown as Redis;
  const provider = { initiate3DS: async () => undefined, getStatus: async () => undefined } as unknown as PaymentProviderService;
  const kyc = {
    validate: async () => undefined,
    isVerified: async () => true,
  } as unknown as KycService;
  const settlementSvc = {
    reserve: async () => undefined,
    commit: async () => undefined,
    cancel: async () => undefined,
  } as unknown as SettlementService;
  const service = new WalletService(
    accountRepo,
    journalRepo,
    disbRepo,
    settleRepo,
    events,
    redis,
    provider,
    kyc,
    settlementSvc,
  );
  (service as any).enqueueDisbursement = async () => undefined;
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

function commitBatch(
  service: WalletService,
  accounts: Account[],
  batch: BatchEntry[],
  ref: string,
) {
  return (service as any).record(
    'test',
    ref,
    batch.map((e) => ({ account: accounts[e.account], amount: e.delta })),
  );
}

const batchArb = fc
  .uniqueArray(
    fc.record({
      account: fc.integer({ min: 0, max: 2 }),
      delta: fc.integer({ min: -100, max: 100 }).filter((n) => n !== 0),
    }),
    { minLength: 1, maxLength: 2, selector: (a) => a.account },
  )
  .chain((entries) =>
    fc
      .integer({ min: 0, max: 2 })
      .filter((account) => !entries.some((e) => e.account === account))
      .map((account) => {
        const sum = entries.reduce((s, e) => s + e.delta, 0);
        return [...entries, { account, delta: -sum }];
      }),
  );

export async function ledgerDeltasSumToZero() {
  await fc.assert(
    fc.asyncProperty(batchArb, async (batch) => {
      const { dataSource, service, accounts, journalRepo } = await setup();
      try {
        const ref = randomUUID();
        await commitBatch(service, accounts, batch, ref);
        const entries = await journalRepo.find({ where: { refType: 'test', refId: ref } });
        const total = entries.reduce((sum, e) => sum + Number(e.amount), 0);
        if (total !== 0) {
          await writeFailure({ kind: 'batch', batch, entries, total });
        }
        assert.equal(total, 0);
      } finally {
        await dataSource.destroy();
      }
    }),
    { numRuns: 25 },
  );
}

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
    .sort((a, b) =>
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

export async function handLogsReplayable() {
  await fc.assert(
    fc.asyncProperty(settlementBatchArb, async (settlements) => {
      const { dataSource, service, journalRepo } = await setupHand();
      try {
        const handId = randomUUID();
        await writeHandLedger(service, dataSource, handId, 'river' as Street, 0, settlements);
        const original = normalize(await journalRepo.find());
        const { dataSource: ds2, service: service2, journalRepo: jr2 } = await setupHand();
        try {
          await writeHandLedger(service2, ds2, handId, 'river' as Street, 0, settlements);
          const replayed = normalize(await jr2.find());
          if (JSON.stringify(original) !== JSON.stringify(replayed)) {
            await writeFailure({ kind: 'replay', settlements, original, replayed });
          }
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
}

if (process.argv[1] === __filename) {
  (async () => {
    await ledgerDeltasSumToZero();
    await handLogsReplayable();
  })();
}

