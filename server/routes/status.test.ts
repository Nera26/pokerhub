/** @jest-environment node */
import express from 'express';
import request from 'supertest';
import routes from './index';

describe('status proxy route', () => {
  afterEach(() => {
    (global.fetch as any)?.mockReset?.();
  });

  it('returns backend status response', async () => {
    const app = express();
    app.use('/api', routes);

    const payload = { ok: true };
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      json: async () => payload,
    }) as any;

    const res = await request(app).get('/api/status');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(payload);
    expect(global.fetch).toHaveBeenCalled();
    expect(res.headers['strict-transport-security']).toBe(
      'max-age=31536000; includeSubDomains',
    );
    expect(res.headers['content-security-policy']).toBe(
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
    );
  });
});
