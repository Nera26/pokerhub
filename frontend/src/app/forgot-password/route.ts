import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function redirectToSite(request: NextRequest) {
  return NextResponse.redirect(new URL('/(site)/forgot-password', request.url));
}

export { redirectToSite as GET, redirectToSite as POST };
