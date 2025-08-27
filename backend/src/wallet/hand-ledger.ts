import { WalletService } from './wallet.service';
import { SettlementEntry } from '../game/settlement';

/**
 * Writes ledger movements for a completed hand.
 * Losers have their losses reserved, then the total pot is committed.
 */
export async function writeHandLedger(
  wallet: WalletService,
  handId: string,
  settlements: SettlementEntry[],
): Promise<void> {
  let total = 0;
  for (const entry of settlements) {
    if (entry.delta < 0) {
      const amount = -entry.delta;
      total += amount;
      await wallet.reserve(entry.playerId, amount, handId);
    }
  }
  if (total > 0) {
    await wallet.commit(handId, total, 0);
  }
}
