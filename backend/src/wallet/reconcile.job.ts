import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { Logger } from 'nestjs-pino';
import { EventPublisher } from '../events/events.service';
import { WalletService } from './wallet.service';

export async function runReconcile(
  wallet: WalletService,
  events?: EventPublisher,
) {
  const report = await wallet.reconcile();
  const dir = path.resolve(process.cwd(), '..', 'storage');
  mkdirSync(dir, { recursive: true });

  const today = new Date().toISOString().slice(0, 10);
  const file = path.join(dir, `reconcile-${today}.json`);
  writeFileSync(file, JSON.stringify(report, null, 2));

  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const date = yesterday.toISOString().slice(0, 10);
  let total = 0;
  for (const kind of ['hand-logs', 'tournament-logs']) {
    const log = path.join(dir, kind, `${date}.jsonl`);
    if (!existsSync(log)) continue;
    const lines = readFileSync(log, 'utf8').split(/\n+/).filter(Boolean);
    for (const line of lines) {
      try {
        const obj = JSON.parse(line);
        const accounts: unknown = obj.accounts;
        if (Array.isArray(accounts)) {
          total += accounts.reduce((s, n) => s + Number(n), 0);
        } else if (accounts && typeof accounts === 'object') {
          total += Object.values(accounts as Record<string, number>).reduce(
            (s, n) => s + Number(n),
            0,
          );
        }
      } catch {
        /* ignore */
      }
    }
  }

  if (total !== 0) {
    await events?.emit('wallet.reconcile.mismatch', { date, total });
  }

  if (report.length > 0 || total !== 0) {
    throw new Error('wallet reconciliation discrepancies');
  }
}

export function scheduleReconcileJob(
  wallet: WalletService,
  logger: Logger,
  events: EventPublisher,
) {
  const oneDay = 24 * 60 * 60 * 1000;
  const now = new Date();
  const next = new Date(now);
  next.setDate(now.getDate() + 1);
  next.setHours(0, 0, 0, 0);
  const delay = next.getTime() - now.getTime();
  const run = () =>
    runReconcile(wallet, events).catch((err) => {
      logger.error({ err }, 'wallet reconciliation failed');
      process.exit(1);
    });
  setTimeout(() => {
    run();
    setInterval(run, oneDay);
  }, delay);
}
