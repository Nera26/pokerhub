const test = require('node:test');
const assert = require('node:assert');
const {
  detectSharedIP,
  detectChipDumping,
  detectSynchronizedBetting,
  detectCorrelatedBetting,
  detectNetworkProximity,
} = require('../heuristics');

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

test('detectChipDumping aggregates transfers over threshold', () => {
  const transfers = [
    { from: 'a', to: 'b', amount: 60000 },
    { from: 'a', to: 'b', amount: 50000 },
    { from: 'b', to: 'a', amount: 1000 },
  ];
  assert.deepStrictEqual(detectChipDumping(transfers, 100000), [
    { from: 'a', to: 'b', total: 110000 },
  ]);
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

test('detectCorrelatedBetting identifies correlated bet amounts', () => {
  const bets = [
    { handId: 'h1', playerId: 'a', amount: 100 },
    { handId: 'h1', playerId: 'b', amount: 200 },
    { handId: 'h2', playerId: 'a', amount: 150 },
    { handId: 'h2', playerId: 'b', amount: 300 },
    { handId: 'h3', playerId: 'a', amount: 200 },
    { handId: 'h3', playerId: 'b', amount: 400 },
    { handId: 'h1', playerId: 'c', amount: 50 },
    { handId: 'h2', playerId: 'c', amount: 120 },
    { handId: 'h3', playerId: 'c', amount: 60 },
  ];
  const res = detectCorrelatedBetting(bets, 0.9, 3);
  assert.strictEqual(res.length, 1);
  assert.deepStrictEqual(res[0].players, ['a', 'b']);
  assert.ok(res[0].correlation > 0.99);
});

test('detectNetworkProximity flags players within distance', () => {
  const sessions = [
    { playerId: 'a', lat: 40.0, lon: -75.0 },
    { playerId: 'b', lat: 40.1, lon: -75.1 },
    { playerId: 'c', lat: 41.0, lon: -74.0 },
  ];
  const res = detectNetworkProximity(sessions, 50);
  assert.strictEqual(res.length, 1);
  assert.deepStrictEqual(res[0].players, ['a', 'b']);
});
