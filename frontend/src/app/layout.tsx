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
import ErrorBoundary from './components/ui/ErrorBoundary';
import ErrorFallback from './components/ui/ErrorFallback';
import { ApiErrorProvider } from '@/hooks/useApiError';
import { AuthProvider } from '@/context/AuthContext';
import ServiceWorker from './ServiceWorker';
import LanguageSelector from './components/common/LanguageSelector';
import { buildMetadata } from '@/lib/metadata';
import PerformanceMonitor from './PerformanceMonitor';
import { env } from '@/lib/env';
import ContractMismatchNotice from '@/components/ContractMismatchNotice';
import { getBaseUrl } from '@/lib/base-url';
import { TranslationsResponseSchema } from '@shared/types';

export async function generateMetadata() {
  const meta = await buildMetadata();
  return {
    title: meta.title,
    description: meta.description,
  };
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover', // safe areas
  // optional: maximumScale: 1, userScalable: false, // prevents pinch zoom (not great for a11y)
};

// Next.js will inject a <meta name="viewport"> tag based on the export above.

function unflatten(messages: Record<string, string>) {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(messages)) {
    const parts = key.split('.');
    let obj = result;
    for (let i = 0; i < parts.length - 1; i++) {
      obj[parts[i]] = obj[parts[i]] ?? {};
      obj = obj[parts[i]];
    }
    obj[parts[parts.length - 1]] = value;
  }
  return result;
}

async function loadMessages(locale: string) {
  const base = getBaseUrl();
  try {
    const res = await fetch(`${base}/api/translations/${locale}`);
    const data = await res.json();
    return unflatten(TranslationsResponseSchema.parse(data).messages);
  } catch {
    const res = await fetch(`${base}/api/translations/en`);
    const data = await res.json();
    return unflatten(TranslationsResponseSchema.parse(data).messages);
  }
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value || 'en';
  const messages = await loadMessages(locale);
  const skipText = messages.layout?.skip ?? 'Skip to main content';
  const meta = await buildMetadata();

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
            <AuthProvider>
              <ApiErrorProvider>
                <ErrorBoundary
                  fallback={
                    <ErrorFallback onRetry={() => window.location.reload()} />
                  }
                >
                  {children}
                </ErrorBoundary>
                <ContractMismatchNotice />
              </ApiErrorProvider>
            </AuthProvider>
          </ReactQueryProvider>
          {env.NODE_ENV === 'production' && !env.IS_E2E && (
            <PerformanceMonitor />
          )}
          {env.NODE_ENV === 'production' && !env.IS_E2E && <SpeedInsights />}
          {env.NODE_ENV === 'production' && !env.IS_E2E && <Analytics />}
          {!env.IS_E2E && <ServiceWorker />}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
