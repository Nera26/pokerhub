import { render, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ForgotPasswordFeature from '@/features/forgot-password';
import SiteForgotPasswordPage from '@/app/(site)/forgot-password/page';
import type { NextRequest } from 'next/server';

let GET: (req: NextRequest) => Response;

beforeAll(async () => {
  const { Request, Response, Headers } = require('node-fetch');
  Object.assign(globalThis, { Request, Response, Headers });
  ({ GET } = await import('@/app/forgot-password/route'));
});

describe('forgot-password routes', () => {
  it('redirects /forgot-password to site version', () => {
    const res = GET({ url: 'http://localhost/forgot-password' } as NextRequest);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')?.endsWith('/(site)/forgot-password')).toBe(
      true,
    );
  });

  it('renders the same component for /site/forgot-password', async () => {
    const client1 = new QueryClient();
    const { container, findByRole } = render(
      <QueryClientProvider client={client1}>
        <SiteForgotPasswordPage />
      </QueryClientProvider>,
    );
    await findByRole('heading', { name: /forgot password/i });
    const siteHTML = container.innerHTML;
    cleanup();
    const client2 = new QueryClient();
    const { container: featureContainer } = render(
      <QueryClientProvider client={client2}>
        <ForgotPasswordFeature />
      </QueryClientProvider>,
    );
    expect(featureContainer.innerHTML).toBe(siteHTML);
  });
});
