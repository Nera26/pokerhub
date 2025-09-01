import { stateDiff } from '../../src/game/state-diff';

describe('stateDiff', () => {
  it('computes deltas for nested objects', () => {
    const prev = { a: { b: 1 }, c: 2 };
    const curr = { a: { b: 2 }, c: 2 };
    expect(stateDiff(prev, curr)).toEqual({ a: { b: 2 } });
  });

  it('treats arrays as primitives', () => {
    const prev = { a: [1, 2], b: 3 };
    const curr = { a: [1, 3], b: 3 };
    expect(stateDiff(prev, curr)).toEqual({ a: [1, 3] });
  });

  it('returns empty object when nothing changes', () => {
    const prev = { a: 1, b: { c: 2 } };
    const curr = { a: 1, b: { c: 2 } };
    expect(stateDiff(prev, curr)).toEqual({});
  });
});
