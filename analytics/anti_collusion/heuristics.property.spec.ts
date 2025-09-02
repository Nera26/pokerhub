import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';

const {
  detectSharedIP,
  detectChipDumping,
  detectSynchronizedBetting,
} = require('./heuristics.js');

test('detectSharedIP invariants', () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.record({
          playerId: fc.string(),
          ip: fc.ipV4(),
        })
      ),
      (sessions) => {
        const res = detectSharedIP(sessions);
        const map = new Map<string, Set<string>>();
        for (const s of sessions) {
          if (!map.has(s.ip)) map.set(s.ip, new Set());
          map.get(s.ip)!.add(s.playerId);
        }
        for (const { ip, players } of res) {
          const expected = map.get(ip);
          if (!expected || expected.size <= 1) return false;
          if (players.length !== expected.size) return false;
          for (const p of players) if (!expected.has(p)) return false;
        }
        for (const [ip, set] of map.entries()) {
          const inRes = res.some((r: any) => r.ip === ip);
          if (set.size > 1 ? !inRes : inRes) return false;
        }
        return true;
      }
    )
  );
});

test('detectSharedIP handles repetitive sessions and empty input', () => {
  assert.deepStrictEqual(detectSharedIP([]), []);
  const ip = '1.1.1.1';
  const sessions = Array(5).fill({ playerId: 'p1', ip });
  assert.deepStrictEqual(detectSharedIP(sessions), []);
});

test('detectChipDumping invariants', () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.record({
          from: fc.string(),
          to: fc.string(),
          amount: fc.integer({ min: 0, max: 1e12 }),
        })
      ),
      fc.integer({ min: 0, max: 1e12 }),
      (transfers, threshold) => {
        const res = detectChipDumping(transfers, threshold);
        const map = new Map<string, number>();
        for (const t of transfers) {
          const key = `${t.from}->${t.to}`;
          map.set(key, (map.get(key) || 0) + t.amount);
        }
        for (const { from, to, total } of res) {
          const key = `${from}->${to}`;
          if (map.get(key) !== total || total <= threshold) return false;
        }
        for (const [key, total] of map.entries()) {
          const exists = res.some((r: any) => `${r.from}->${r.to}` === key);
          if (total > threshold ? !exists : exists) return false;
        }
        return true;
      }
    )
  );
});

test('detectChipDumping handles empty input and extreme amounts', () => {
  assert.deepStrictEqual(detectChipDumping([], 100), []);
  const max = Number.MAX_SAFE_INTEGER;
  const transfers = [{ from: 'a', to: 'b', amount: max }];
  assert.deepStrictEqual(detectChipDumping(transfers, max - 1), [
    { from: 'a', to: 'b', total: max },
  ]);
});

test('detectSynchronizedBetting invariants', () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.record({
          handId: fc.string(),
          playerId: fc.string(),
          timeMs: fc.integer({ min: 0, max: 100000 }),
        })
      ),
      fc.integer({ min: 0, max: 1000 }),
      (events, windowMs) => {
        const res = detectSynchronizedBetting(events, windowMs);
        const byHand = new Map<string, typeof events>();
        for (const e of events) {
          if (!byHand.has(e.handId)) byHand.set(e.handId, []);
          byHand.get(e.handId)!.push(e);
        }
        for (const { handId, players } of res) {
          const list = byHand.get(handId) || [];
          const times = list.map((e) => e.timeMs).sort((a, b) => a - b);
          const condition =
            times.length > 1 && times[times.length - 1] - times[0] <= windowMs;
          if (!condition) return false;
          const expectedPlayers = list.map((e) => e.playerId);
          if (players.length !== expectedPlayers.length) return false;
          for (let i = 0; i < players.length; i++)
            if (players[i] !== expectedPlayers[i]) return false;
        }
        for (const [handId, list] of byHand.entries()) {
          const times = list.map((e) => e.timeMs).sort((a, b) => a - b);
          const condition =
            times.length > 1 && times[times.length - 1] - times[0] <= windowMs;
          const exists = res.some((r: any) => r.handId === handId);
          if (condition !== exists) return false;
        }
        return true;
      }
    )
  );
});

test('detectSynchronizedBetting handles empty input', () => {
  assert.deepStrictEqual(detectSynchronizedBetting([], 200), []);
});
