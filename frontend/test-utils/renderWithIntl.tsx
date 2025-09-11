import { NextIntlClientProvider } from 'next-intl';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';

export function renderWithIntl(
  ui: ReactElement,
  {
    locale = 'en',
    messages = {},
  }: { locale?: string; messages?: Record<string, unknown> } = {},
) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages as any}>
      {ui}
    </NextIntlClientProvider>,
  );
}
