import {
  login,
  logout,
  requestPasswordReset,
  verifyResetCode,
  resetPassword,
} from '@/lib/api/auth';
import { server } from '@/test-utils/server';
import { mockSuccess, mockError } from '@/test-utils/handlers';

describe('auth api', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('handles login and password reset flow', async () => {
    server.use(
      mockSuccess({ token: 'tok' }, { once: true }),
      mockSuccess({ message: 'ok' }, { once: true }),
      mockSuccess({ message: 'ok' }, { once: true }),
      mockSuccess({ message: 'ok' }, { once: true }),
      mockSuccess({ message: 'ok' }, { once: true }),
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
    server.use(mockError());
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
