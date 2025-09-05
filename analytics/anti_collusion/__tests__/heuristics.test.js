const test = require('node:test');
const assert = require('node:assert');
require('ts-node/register');
const {
  detectSharedIP,
  detectChipDump,
  detectSynchronizedBetting,
} = require('../../../shared/analytics/collusion');

test('detectSharedIP flags multiple players on same IP', () => {
  const sessions = [
    { playerId: 'a', ip: '1.1.1.1' },
    { playerId: 'b', ip: '1.1.1.1' },
    { playerId: 'c', ip: '2.2.2.2' },
  ];
  assert.deepStrictEqual(detectSharedIP(sessions), [
    { ip: '1.1.1.1', players: ['a', 'b'] },
  ]);
});

test('detectChipDump computes imbalance ratio', () => {
  const transfers = [
    { from: 'a', to: 'b', amount: 60000 },
    { from: 'a', to: 'b', amount: 50000 },
    { from: 'b', to: 'a', amount: 1000 },
  ];
  const score = detectChipDump(transfers);
  assert.ok(score > 0.49);
});

test('detectSynchronizedBetting finds actions within window', () => {
  const events = [
    { handId: '1', playerId: 'a', timeMs: 100 },
    { handId: '1', playerId: 'b', timeMs: 150 },
    { handId: '2', playerId: 'a', timeMs: 100 },
    { handId: '2', playerId: 'b', timeMs: 400 },
  ];
  const res = detectSynchronizedBetting(events, 100);
  assert.deepStrictEqual(res, [{ handId: '1', players: ['a', 'b'] }]);
});
