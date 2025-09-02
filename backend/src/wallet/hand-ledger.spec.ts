import { writeHandLedger } from './hand-ledger';
import type { Street } from '../game/state-machine';

describe('writeHandLedger transactional rollback', () => {
  it('restores balances when commit fails', async () => {
    const balances: Record<string, number> = {
      user: 1000,
      reserve: 0,
      prize: 0,
    };
    const wallet: any = {
      reserve: async (playerId: string, amount: number) => {
        balances[playerId] -= amount;
        balances.reserve += amount;
      },
      commit: async () => {
        balances.reserve -= 100;
        balances.prize += 100;
        throw new Error('boom');
      },
    };
    const ds: any = {
      async transaction(fn: any) {
        const snap = { ...balances };
        try {
          await fn({});
        } catch (e) {
          Object.assign(balances, snap);
          throw e;
        }
      },
    };
    const settlements = [
      { playerId: 'user', delta: -100 },
      { playerId: 'winner', delta: 100 },
    ];
    await expect(
      writeHandLedger(wallet, ds, 'hand', 'river' as Street, 0, settlements),
    ).rejects.toThrow('boom');
    expect(balances.user).toBe(1000);
    expect(balances.reserve).toBe(0);
    expect(balances.prize).toBe(0);
  });
});
