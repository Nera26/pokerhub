import { render, screen } from '@testing-library/react';

jest.mock('@vercel/speed-insights/next', () => ({ SpeedInsights: () => null }));
jest.mock('@vercel/analytics/next', () => ({ Analytics: () => null }));
jest.mock('nextjs-toploader', () => () => null);
jest.mock('../ReactQueryProvider', () => ({
  __esModule: true,
  default: ({ children }: any) => <>{children}</>,
}));
jest.mock('../components/ui/ErrorBoundary', () => ({
  __esModule: true,
  default: ({ children }: any) => <>{children}</>,
}));
jest.mock('../components/ui/ErrorFallback', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@/hooks/useApiError', () => ({
  ApiErrorProvider: ({ children }: any) => <>{children}</>,
}));
jest.mock('@/context/AuthContext', () => ({
  AuthProvider: ({ children }: any) => <>{children}</>,
}));
jest.mock('../ServiceWorker', () => () => null);
jest.mock('../components/common/LanguageSelector', () => () => null);
jest.mock('@/components/ContractMismatchNotice', () => () => null);
jest.mock('@/lib/metadata', () => ({
  buildMetadata: async () => ({
    title: '',
    description: '',
    image: '',
    url: '',
  }),
}));
jest.mock('@/lib/base-url', () => ({ getBaseUrl: () => '' }));
jest.mock('next/headers', () => ({
  cookies: () => ({ get: () => ({ value: 'en' }) }),
}));
jest.mock('@fortawesome/fontawesome-svg-core/styles.css', () => ({}));
jest.mock('@fortawesome/fontawesome-svg-core', () => ({
  config: { autoAddCss: false },
}));

jest.mock('@/hooks/useOffline', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import { OfflineBanner } from '../layout';

const mockUseOffline = require('@/hooks/useOffline').default as jest.Mock;

describe('OfflineBanner', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders banner when offline', () => {
    mockUseOffline.mockReturnValue({ online: false, retry: jest.fn() });
    render(<OfflineBanner />);
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('hides banner when online', () => {
    mockUseOffline.mockReturnValue({ online: true, retry: jest.fn() });
    render(<OfflineBanner />);
    expect(
      screen.queryByRole('button', { name: /retry/i }),
    ).not.toBeInTheDocument();
  });
});
