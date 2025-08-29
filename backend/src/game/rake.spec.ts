import { resolveRake } from './rake';

describe('rake resolution', () => {
  afterEach(() => {
    delete process.env.RAKE_CONFIG;
  });

  it('applies percentage up to cap', () => {
    process.env.RAKE_CONFIG = JSON.stringify({
      '1-2': { percent: 0.05, cap: 1 },
    });
    expect(resolveRake(100, '1-2')).toBe(1);
  });

  it('uses percentage when below cap', () => {
    process.env.RAKE_CONFIG = JSON.stringify({
      '5-10': { percent: 0.05, cap: 10 },
    });
    expect(resolveRake(100, '5-10')).toBe(5);
  });

  it('defaults to zero when stake missing', () => {
    process.env.RAKE_CONFIG = JSON.stringify({});
    expect(resolveRake(100, 'unknown')).toBe(0);
  });
});
