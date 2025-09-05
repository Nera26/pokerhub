import { test } from 'node:test';
import fc from 'fast-check';
import assert from 'node:assert/strict';
import {
  detectSharedIP,
  detectChipDump,
  detectSynchronizedBetting,
} from '../../shared/analytics/collusion';

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

test('detectChipDump flags imbalanced transfers', () => {
  fc.assert(
    fc.property(
      fc.array(
        fc.record({
          from: fc.uuid(),
          to: fc.uuid(),
          amount: fc.integer({ min: 0, max: 1000 }),
        })
      ),
      (transfers) => {
        const from = 'colluderA';
        const to = 'colluderB';
        transfers.push({ from, to, amount: 1000 });
        const score = detectChipDump(transfers);
        return score > 0;
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
