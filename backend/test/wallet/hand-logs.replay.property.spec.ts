import { readdirSync, readFileSync, promises as fs, existsSync } from 'fs';
import path from 'path';
import { JournalEntry } from '../../src/wallet/journal-entry.entity';
import { setupFlow, seedAccounts } from './flow-test-utils';

async function writeFailure(data: unknown) {
  const dir = path.join(__dirname, '../../../storage');
  await fs.mkdir(dir, { recursive: true });
  const today = new Date().toISOString().slice(0, 10);
  const file = path.join(dir, `reconcile-${today}.json`);
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

interface ReplayResult {
  entries: { account: string; amount: number; ref: string }[];
}

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

async function replay(file: string): Promise<ReplayResult> {
  const lines = readFileSync(file, 'utf8').trim().split('\n').filter(Boolean);
  const accountIds = Array.from(
    new Set(
      lines.flatMap((line) => Object.keys(JSON.parse(line).accounts || {})),
    ),
  );
  const { dataSource, service, accountRepo, journalRepo } =
    await setupFlow();
  const accounts = await seedAccounts(accountRepo, accountIds);
  try {
    for (const [index, line] of lines.entries()) {
      const { accounts: acct } = JSON.parse(line);
      if (!acct) continue;
      const entries = Object.entries(acct).map(([id, amt]) => ({
        account: id,
        amount: Number(amt),
      }));
      const total = entries.reduce((s, e) => s + e.amount, 0);
      if (total !== 0) {
        await writeFailure({ kind: 'batch', file, index, entries, total });
      }
      expect(total).toBe(0);
      const batch = entries.map((e) => ({
        account: accounts.get(e.account)!,
        amount: e.amount,
      }));
      await (service as any).record(
        'replay',
        `${path.basename(file)}#${index}`,
        batch,
      );
    }
    const all = await journalRepo.find();
    const sum = all.reduce((s, e) => s + Number(e.amount), 0);
    if (sum !== 0) {
      await writeFailure({ kind: 'journal', file, entries: all, sum });
    }
    expect(sum).toBe(0);
    return { entries: normalize(all) };
  } finally {
    await dataSource.destroy();
  }
}

describe('hand log replay', () => {
  const dir = path.join(__dirname, '../../../storage/hand-logs');
  const files = existsSync(dir)
    ? readdirSync(dir).filter((f) => f.endsWith('.jsonl'))
    : [];
  if (files.length === 0) {
    it('no hand logs to replay', () => {
      expect(true).toBe(true);
    });
  }
  for (const file of files) {
    it(`${file} maintains zero-sum totals`, async () => {
      const full = path.join(dir, file);
      const first = await replay(full);
      const second = await replay(full);
      if (JSON.stringify(second) !== JSON.stringify(first)) {
        await writeFailure({ kind: 'replay', file: full, first, second });
      }
      expect(second).toEqual(first);
    });
  }
});

