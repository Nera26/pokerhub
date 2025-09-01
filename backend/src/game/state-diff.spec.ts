import { diff } from './state-diff';

describe('state diff', () => {
  it('diffs nested objects', () => {
    const prev = { a: { b: 1, c: 2 }, d: 3 };
    const curr = { a: { b: 1, c: 3 }, d: 3 };
    expect(diff(prev, curr)).toEqual({ a: { c: 3 } });
  });

  it('diffs arrays of objects', () => {
    const prev = { arr: [{ x: 1 }, { x: 2 }] };
    const curr = { arr: [{ x: 1 }, { x: 3 }, { x: 4 }] };
    expect(diff(prev, curr)).toEqual({ arr: { '1': { x: 3 }, '2': { x: 4 } } });
  });
});
