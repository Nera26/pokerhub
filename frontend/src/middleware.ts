import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const csp = [
    "default-src 'self';",
    "script-src 'self' 'nonce-" + nonce + "' 'unsafe-inline';",
    "style-src 'self' 'nonce-" + nonce + "' 'unsafe-inline';",
    "img-src 'self' data:;",
    "connect-src 'self';",
    "font-src 'self';",
    "object-src 'none';",
    "base-uri 'self';",
    "form-action 'self';",
    "frame-ancestors 'none';",
  ].join(' ');

  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()',
  );

  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    const cookies = setCookie.split(/,(?=[^;]*=)/);
    response.headers.delete('set-cookie');
    cookies.forEach((cookie) => {
      let updated = cookie;
      if (!/; *Secure/i.test(updated)) updated += '; Secure';
      if (!/; *HttpOnly/i.test(updated)) updated += '; HttpOnly';
      if (!/; *SameSite=/i.test(updated)) updated += '; SameSite=Strict';
      response.headers.append('set-cookie', updated);
    });
  }

  return response;
}

export const config = {
  matcher: '/:path*',
};
