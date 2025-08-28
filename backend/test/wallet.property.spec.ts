import fc from 'fast-check';
import { writeHandLedger } from '../src/wallet/hand-ledger';

interface SettlementEntry {
  playerId: string;
  delta: number;
}

describe('writeHandLedger property', () => {
  it('ledger entries sum to zero for random settlements', async () => {
    const settlementsArb = fc
      .array(
        fc.record({
          playerId: fc.uuid(),
          amount: fc.integer({ min: 1, max: 1000 }),
        }),
        { minLength: 1, maxLength: 5 },
      )
      .map((losses) => {
        const total = losses.reduce((s, l) => s + l.amount, 0);
        return [
          ...losses.map((l) => ({ playerId: l.playerId, delta: -l.amount })),
          { playerId: 'winner', delta: total },
        ] as SettlementEntry[];
      });

    await fc.assert(
      fc.asyncProperty(settlementsArb, async (settlements) => {
        const ledger: Record<string, number> = {};
        const wallet = {
          reserve: async (playerId: string, amount: number) => {
            ledger[playerId] = (ledger[playerId] ?? 0) - amount;
            ledger.reserve = (ledger.reserve ?? 0) + amount;
          },
          commit: async (_ref: string, amount: number) => {
            ledger.reserve = (ledger.reserve ?? 0) - amount;
            ledger.prize = (ledger.prize ?? 0) + amount;
          },
        } as any;

        await writeHandLedger(wallet, 'hand', 'river', 0, settlements);
        const total = Object.values(ledger).reduce((s, v) => s + v, 0);
        expect(total).toBe(0);
      }),
      { numRuns: 50 },
    );
  });
});
