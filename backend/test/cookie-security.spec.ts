import { Request, Response, NextFunction } from 'express';
import { cookieSecurity } from '../src/common/cookie-security.middleware';

describe('cookieSecurity', () => {
  it('adds security flags to Set-Cookie header', () => {
    const headers: Record<string, any> = {};
    const res = {
      setHeader(name: string, value: any) {
        headers[name] = value;
      },
    } as unknown as Response;

    cookieSecurity({} as Request, res, (() => {}) as NextFunction);
    res.setHeader('Set-Cookie', 'test=value');
    const cookie = headers['Set-Cookie'][0];
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Strict');
  });
});
