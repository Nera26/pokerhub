import { diff as stateDiff } from '../../src/game/state-diff';

describe('stateDiff', () => {
  it('computes deltas for nested objects', () => {
    const prev = { a: { b: 1 }, c: 2 };
    const curr = { a: { b: 2 }, c: 2 };
    expect(stateDiff(prev, curr)).toEqual({ a: { b: 2 } });
  });

  it('diffs arrays by index and length', () => {
    const prev = { a: [1, 2], b: 3 };
    const curr = { a: [1, 3, 4], b: 3 };
    expect(stateDiff(prev, curr)).toEqual({ a: { '1': 3, '2': 4, length: 3 } });
  });

  it('returns empty object when nothing changes', () => {
    const prev = { a: 1, b: { c: 2 } };
    const curr = { a: 1, b: { c: 2 } };
    expect(stateDiff(prev, curr)).toEqual({});
  });
});
