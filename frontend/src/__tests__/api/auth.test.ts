/** @jest-environment node */

import {
  login,
  logout,
  requestPasswordReset,
  verifyResetCode,
  resetPassword,
} from '@/lib/api/auth';
import { mockFetch, mockFetchError } from '@/test-utils/mockFetch';

describe('auth api', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('handles login and password reset flow', async () => {
    mockFetch(
      { status: 200, payload: { token: 'tok' } },
      { status: 200, payload: { message: 'ok' } },
      { status: 200, payload: { message: 'ok' } },
      { status: 200, payload: { message: 'ok' } },
      { status: 200, payload: { message: 'ok' } },
    );

    await expect(login('u@example.com', 'p')).resolves.toEqual({
      token: 'tok',
    });
    await expect(logout()).resolves.toEqual({ message: 'ok' });
    await expect(requestPasswordReset('u@example.com')).resolves.toEqual({
      message: 'ok',
    });
    await expect(verifyResetCode('u@example.com', 'c')).resolves.toEqual({
      message: 'ok',
    });
    await expect(resetPassword('u@example.com', 'c', 'np')).resolves.toEqual({
      message: 'ok',
    });
  });

  it('throws ApiError on failure', async () => {
    mockFetchError();
    const err = {
      status: 500,
      message: 'Server Error',
      details: '{"error":"fail"}',
    };
    await expect(login('u@example.com', 'p')).rejects.toEqual(err);
    await expect(logout()).rejects.toEqual(err);
    await expect(requestPasswordReset('u@example.com')).rejects.toEqual(err);
    await expect(verifyResetCode('u@example.com', 'c')).rejects.toEqual(err);
    await expect(resetPassword('u@example.com', 'c', 'np')).rejects.toEqual(
      err,
    );
  });
});
