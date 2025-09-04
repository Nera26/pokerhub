import { Request, Response, NextFunction } from 'express';

export function cookieSecurity(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  const original = res.setHeader.bind(res);
  res.setHeader = (name: string, value: any) => {
    if (name.toLowerCase() === 'set-cookie') {
      const cookies = Array.isArray(value) ? value : [value];
      value = cookies.map((c: string) => {
        const lower = c.toLowerCase();
        let cookie = c;
        if (!lower.includes('samesite')) cookie += '; SameSite=Strict';
        if (!lower.includes('httponly')) cookie += '; HttpOnly';
        if (!lower.includes('secure')) cookie += '; Secure';
        return cookie;
      });
    }
    original(name, value);
  };

  next();
}
