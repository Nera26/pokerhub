import { Request, Response, NextFunction } from 'express';

const enforceSecureCookies =
  (process.env.COOKIE_SECURE ?? 'true').toLowerCase() !== 'false';

export function cookieSecurity(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  const original = res.setHeader.bind(res) as Response['setHeader'];
  res.setHeader = ((name, value) => {
    let headerValue = value;
    if (typeof name === 'string' && name.toLowerCase() === 'set-cookie') {
      const cookies = Array.isArray(headerValue) ? headerValue : [headerValue];
      headerValue = cookies.map((c) => {
        const cookieString = String(c);
        const lower = cookieString.toLowerCase();
        let cookie = cookieString;
        if (!lower.includes('samesite')) cookie += '; SameSite=Strict';
        if (!lower.includes('httponly')) cookie += '; HttpOnly';
        if (enforceSecureCookies && !lower.includes('secure')) {
          cookie += '; Secure';
        }
        return cookie;
      });
    }
    return original(name, headerValue);
  }) as Response['setHeader'];

  next();
}
