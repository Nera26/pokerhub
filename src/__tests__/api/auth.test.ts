/** @jest-environment node */

import { POST as login } from '@/app/api/auth/login/route';
import { POST as logout } from '@/app/api/auth/logout/route';
import { POST as requestReset } from '@/app/api/auth/request-reset/route';
import { POST as verifyReset } from '@/app/api/auth/verify-reset-code/route';
import { POST as resetPassword } from '@/app/api/auth/reset-password/route';
import { USERS, resetCodes } from '@/app/api/auth/data';
import type { NextRequest } from 'next/server';

function jsonRequest<T>(url: string, body: T): NextRequest {
  return new Request(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  }) as unknown as NextRequest;
}

describe('auth API', () => {
  afterEach(() => {
    resetCodes.clear();
    USERS[0].password = 'password123';
  });

  it('logs in with valid credentials', async () => {
    const res = await login(
      jsonRequest('http://test/api/auth/login', {
        email: 'player@example.com',
        password: 'password123',
      }),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.token).toBeDefined();
    const cookie = res.headers.get('set-cookie');
    expect(cookie).toContain('session=');
    expect(cookie).toContain('SameSite=strict');
  });

  it('logs out and clears the session cookie', async () => {
    const loginRes = await login(
      jsonRequest('http://test/api/auth/login', {
        email: 'player@example.com',
        password: 'password123',
      }),
    );
    const cookie = loginRes.headers.get('set-cookie')!;

    const res = await logout(
      new Request('http://test/api/auth/logout', {
        method: 'POST',
        headers: { cookie },
      }) as unknown as NextRequest,
    );
    expect(res.status).toBe(200);
    const cleared = res.headers.get('set-cookie');
    expect(cleared).toContain('session=');
    expect(cleared).toContain('Max-Age=0');
  });

  it('rejects missing email', async () => {
    const res = await login(
      jsonRequest('http://test/api/auth/login', { password: 'password123' }),
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.errors.email).toBeDefined();
  });

  it('handles password reset flow', async () => {
    const email = 'player@example.com';
    const requestRes = await requestReset(
      jsonRequest('http://test/api/auth/request-reset', { email }),
    );
    expect(requestRes.status).toBe(200);
    const code = resetCodes.get(email)!;

    const verifyRes = await verifyReset(
      jsonRequest('http://test/api/auth/verify-reset-code', { email, code }),
    );
    expect(verifyRes.status).toBe(200);

    const resetRes = await resetPassword(
      jsonRequest('http://test/api/auth/reset-password', {
        email,
        code,
        password: 'newpass123',
      }),
    );
    expect(resetRes.status).toBe(200);
    expect(USERS[0].password).toBe('newpass123');
  });
});
