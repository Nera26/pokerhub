import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import {
  detectSharedIP,
  detectChipDump,
  detectSynchronizedBetting,
} from '../../shared/analytics/collusion';

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

test('detectChipDump returns ratio between 0 and 1', () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.record({
          from: fc.string(),
          to: fc.string(),
          amount: fc.integer({ min: 0, max: 1e12 }),
        })
      ),
      (transfers) => {
        const score = detectChipDump(transfers);
        return score >= 0 && score <= 1;
      }
    )
  );
});

test('detectChipDump handles empty and balanced transfers', () => {
  assert.strictEqual(detectChipDump([]), 0);
  const transfers = [
    { from: 'a', to: 'b', amount: 100 },
    { from: 'b', to: 'a', amount: 100 },
  ];
  assert.strictEqual(detectChipDump(transfers), 0);
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
