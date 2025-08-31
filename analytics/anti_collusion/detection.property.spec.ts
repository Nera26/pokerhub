import { test } from 'node:test';
import fc from 'fast-check';
import assert from 'node:assert/strict';

const {
  detectSharedIP,
  detectChipDumping,
  detectSynchronizedBetting,
} = require('./heuristics.js');

test('detectSharedIP flags multiple players on the same IP', () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.record({ playerId: fc.uuid(), ip: fc.ipV4() }),
        { minLength: 2 }
      ),
      fc.ipV4(),
      (sessions, ip) => {
        sessions[0].ip = ip;
        sessions[1].ip = ip;
        const res = detectSharedIP(sessions);
        return res.some(
          (r: any) =>
            r.ip === ip &&
            r.players.includes(sessions[0].playerId) &&
            r.players.includes(sessions[1].playerId)
        );
      }
    )
  );
});

test('detectChipDumping flags over-threshold transfers', () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.record({
          from: fc.uuid(),
          to: fc.uuid(),
          amount: fc.integer({ min: 0, max: 1000 }),
        })
      ),
      fc.integer({ min: 1, max: 1000 }),
      (transfers, threshold) => {
        const from = 'colluderA';
        const to = 'colluderB';
        transfers.push({ from, to, amount: threshold + 1 });
        const res = detectChipDumping(transfers, threshold);
        return res.some(
          (r: any) => r.from === from && r.to === to && r.total > threshold
        );
      }
    )
  );
});

test('detectSynchronizedBetting flags tightly timed events', () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.record({
          handId: fc.uuid(),
          playerId: fc.uuid(),
          timeMs: fc.integer({ min: 0, max: 10000 }),
        })
      ),
      fc.integer({ min: 1, max: 500 }),
      (events, windowMs) => {
        const handId = 'hand-collusion';
        events.push({ handId, playerId: 'playerA', timeMs: 0 });
        events.push({ handId, playerId: 'playerB', timeMs: Math.floor(windowMs / 2) });
        const res = detectSynchronizedBetting(events, windowMs);
        return res.some(
          (r: any) =>
            r.handId === handId &&
            r.players.includes('playerA') &&
            r.players.includes('playerB')
        );
      }
    )
  );
});
