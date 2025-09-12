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

  const baseCsp =
    process.env.NEXT_PUBLIC_CSP?.split(';')
      .map((d) => d.trim())
      .filter(Boolean) ?? [];

  const directives = baseCsp.map((d) => {
    if (d.startsWith('script-src')) return `${d} 'nonce-${nonce}'`;
    if (d.startsWith('style-src')) return `${d} 'nonce-${nonce}'`;
    return d;
  });

  if (!directives.some((d) => d.startsWith('script-src')))
    directives.push(`script-src 'nonce-${nonce}'`);
  if (!directives.some((d) => d.startsWith('style-src')))
    directives.push(`style-src 'nonce-${nonce}'`);

  const csp = directives.map((d) => `${d};`).join(' ');

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
