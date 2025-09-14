/** @jest-environment node */

import {
  login,
  logout,
  requestPasswordReset,
  verifyResetCode,
  resetPassword,
} from '@/lib/api/auth';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer();
const fetchSpy = jest.fn((input: RequestInfo, init?: RequestInit) =>
  server.fetch(input, init),
);

beforeAll(() => {
  server.listen();
  // @ts-expect-error override for tests
  global.fetch = fetchSpy;
});

afterEach(() => {
  server.resetHandlers();
  fetchSpy.mockReset();
});

afterAll(() => {
  server.close();
});

describe('auth api', () => {
  it('handles login and password reset flow', async () => {
    server.use(
      http.post('http://localhost:3000/api/auth/login', () =>
        HttpResponse.json({ token: 'tok' }),
      ),
      http.post('http://localhost:3000/api/auth/logout', () =>
        HttpResponse.json({ message: 'ok' }),
      ),
      http.post('http://localhost:3000/api/auth/request-reset', () =>
        HttpResponse.json({ message: 'ok' }),
      ),
      http.post('http://localhost:3000/api/auth/verify-reset-code', () =>
        HttpResponse.json({ message: 'ok' }),
      ),
      http.post('http://localhost:3000/api/auth/reset-password', () =>
        HttpResponse.json({ message: 'ok' }),
      ),
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
    server.use(
      http.post('http://localhost:3000/api/auth/login', () =>
        HttpResponse.json(
          { error: 'fail' },
          { status: 500, statusText: 'Server Error' },
        ),
      ),
      http.post('http://localhost:3000/api/auth/logout', () =>
        HttpResponse.json(
          { error: 'fail' },
          { status: 500, statusText: 'Server Error' },
        ),
      ),
      http.post('http://localhost:3000/api/auth/request-reset', () =>
        HttpResponse.json(
          { error: 'fail' },
          { status: 500, statusText: 'Server Error' },
        ),
      ),
      http.post('http://localhost:3000/api/auth/verify-reset-code', () =>
        HttpResponse.json(
          { error: 'fail' },
          { status: 500, statusText: 'Server Error' },
        ),
      ),
      http.post('http://localhost:3000/api/auth/reset-password', () =>
        HttpResponse.json(
          { error: 'fail' },
          { status: 500, statusText: 'Server Error' },
        ),
      ),
    );
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
