/** @jest-environment node */

import {
  login,
  logout,
  requestPasswordReset,
  verifyResetCode,
  resetPassword,
} from '@/lib/api/auth';
import { serverFetch } from '@/lib/server-fetch';

jest.mock('@/lib/server-fetch', () => ({
  serverFetch: jest.fn(),
}));

describe('auth api', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('handles login and password reset flow', async () => {
    (serverFetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ token: 'tok' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ message: 'ok' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ message: 'ok' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ message: 'ok' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ message: 'ok' }),
      });

    await expect(login('u@example.com', 'p')).resolves.toEqual({ token: 'tok' });
    await expect(logout()).resolves.toEqual({ message: 'ok' });
    await expect(requestPasswordReset('u@example.com')).resolves.toEqual({ message: 'ok' });
    await expect(verifyResetCode('u@example.com', 'c')).resolves.toEqual({ message: 'ok' });
    await expect(resetPassword('u@example.com', 'c', 'np')).resolves.toEqual({ message: 'ok' });
  });

  it('throws ApiError on failure', async () => {
    (serverFetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      headers: { get: () => 'application/json' },
      json: async () => ({ error: 'fail' }),
    });

    const err = {
      status: 500,
      message: 'Server Error',
      details: '{"error":"fail"}',
    };

    await expect(login('u@example.com', 'p')).rejects.toEqual(err);
    await expect(logout()).rejects.toEqual(err);
    await expect(requestPasswordReset('u@example.com')).rejects.toEqual(err);
    await expect(verifyResetCode('u@example.com', 'c')).rejects.toEqual(err);
    await expect(resetPassword('u@example.com', 'c', 'np')).rejects.toEqual(err);
  });
});
