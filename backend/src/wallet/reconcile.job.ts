import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { Logger } from 'nestjs-pino';
import { WalletService } from './wallet.service';

export async function runReconcile(wallet: WalletService) {
  const report = await wallet.reconcile();
  const dir = path.resolve(process.cwd(), '..', 'storage');
  mkdirSync(dir, { recursive: true });
  const file = path.join(
    dir,
    `reconcile-${new Date().toISOString().slice(0, 10)}.json`,
  );
  writeFileSync(file, JSON.stringify(report, null, 2));
  if (report.length > 0) {
    throw new Error('wallet reconciliation discrepancies');
  }
}

export function scheduleReconcileJob(wallet: WalletService, logger: Logger) {
  const oneDay = 24 * 60 * 60 * 1000;
  const now = new Date();
  const next = new Date(now);
  next.setDate(now.getDate() + 1);
  next.setHours(0, 0, 0, 0);
  const delay = next.getTime() - now.getTime();
  const run = () =>
    runReconcile(wallet).catch((err) => {
      logger.error({ err }, 'wallet reconciliation failed');
      process.exit(1);
    });
  setTimeout(() => {
    run();
    setInterval(run, oneDay);
  }, delay);
}
