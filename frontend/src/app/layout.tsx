// app/layout.tsx
import './globals.css';
import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { config } from '@fortawesome/fontawesome-svg-core';
config.autoAddCss = false;
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import NextTopLoader from 'nextjs-toploader';
import ReactQueryProvider from './ReactQueryProvider';
import { GlobalErrorBoundary } from './error';
import { ApiErrorProvider } from '@/hooks/useApiError';
import ServiceWorker from './ServiceWorker';
import LanguageSelector from './components/common/LanguageSelector';
import { buildMetadata } from '@/lib/metadata';
import PerformanceMonitor from './PerformanceMonitor';
import { env, IS_E2E } from '@/lib/env';
import ContractMismatchNotice from '@/components/ContractMismatchNotice';

const meta = buildMetadata();

export const metadata = {
  title: meta.title,
  description: meta.description,
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover', // safe areas
  // optional: maximumScale: 1, userScalable: false, // prevents pinch zoom (not great for a11y)
};

// Next.js will inject a <meta name="viewport"> tag based on the export above.

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value || 'en';
  const messages = (await import(`../locales/${locale}.json`)).default;
  const skipText = messages.layout?.skip ?? 'Skip to main content';

  return (
    <html lang={locale}>
      <head>
        {/* Next.js will automatically inject metadata.title and metadata.description */}
        <meta charSet="UTF-8" />
        {/* Next injects <meta name="viewport"> from the viewport export */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:image" content={meta.image} />
        <meta property="og:url" content={meta.url} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:image" content={meta.image} />
        <meta name="twitter:url" content={meta.url} />
      </head>
      <body className="bg-primary-bg text-text-primary antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <a href="#main-content" className="sr-only focus:not-sr-only">
            {skipText}
          </a>
          <LanguageSelector />
          <NextTopLoader
            color="var(--color-accent-yellow)"
            height={1}
            showSpinner={false}
          />
          <ReactQueryProvider>
            <ApiErrorProvider>
              <GlobalErrorBoundary>{children}</GlobalErrorBoundary>
              <ContractMismatchNotice />
            </ApiErrorProvider>
          </ReactQueryProvider>
          {env.NODE_ENV === 'production' && !IS_E2E && <PerformanceMonitor />}
          {env.NODE_ENV === 'production' && !IS_E2E && <SpeedInsights />}
          {env.NODE_ENV === 'production' && !IS_E2E && <Analytics />}
          {!IS_E2E && <ServiceWorker />}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
