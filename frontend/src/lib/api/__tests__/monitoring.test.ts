import { describe, expect, it, jest } from '@jest/globals';
import { setupFetch } from './setupFetch';

describe('recordWebVital', () => {
  it('posts web vital metrics to the monitoring endpoint', async () => {
    jest.resetModules();
    process.env.NEXT_PUBLIC_BASE_URL = 'http://example.com';
    const context = setupFetch({ status: 'accepted' });
    const { recordWebVital } = await import('../monitoring');

    await recordWebVital(
      { name: 'LCP', value: 1234, overThreshold: true },
      {
        keepalive: true,
      },
    );

    expect(context.mock).toHaveBeenCalledWith(
      'http://example.com/api/monitoring',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(context.init).toMatchObject({ keepalive: true });
    expect(context.init?.body).toBe(
      JSON.stringify({ name: 'LCP', value: 1234, overThreshold: true }),
    );
  });
});
