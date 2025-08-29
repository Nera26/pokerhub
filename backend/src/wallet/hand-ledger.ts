import { WalletService } from './wallet.service';
import { SettlementEntry } from '../game/settlement';
import type { Street } from '../game/state-machine';

/**
 * Writes ledger movements for a completed hand.
 * Losers have their losses reserved, then the total pot is committed.
 */
export async function writeHandLedger(
  wallet: WalletService,
  handId: string,
  street: Street,
  idx: number,
  settlements: SettlementEntry[],
): Promise<void> {
  const key = `${handId}#${street}#${idx}`;
  let total = 0;
  for (const entry of settlements) {
    if (entry.delta < 0) {
      const amount = -entry.delta;
      total += amount;
      await wallet.reserve(entry.playerId, amount, key, 'USD', key);
    }
  }
  if (total > 0) {
    await wallet.commit(key, total, 0, 'USD', key);
  }
}
