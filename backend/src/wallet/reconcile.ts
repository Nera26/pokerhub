import { WalletService } from './wallet.service';

export function scheduleReconciliation(wallet: WalletService) {
  const oneDay = 24 * 60 * 60 * 1000;
  const run = async () => {
    const report = await wallet.reconcile();
    if (report.length > 0) {
      console.warn('wallet reconciliation discrepancies', report);
    }
  };
  const now = new Date();
  const next = new Date(now);
  next.setDate(now.getDate() + 1);
  next.setHours(0, 0, 0, 0);
  setTimeout(() => {
    run();
    setInterval(run, oneDay);
  }, next.getTime() - now.getTime());
}

