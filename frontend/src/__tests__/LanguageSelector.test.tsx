import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import LanguageSelector from '@/app/components/common/LanguageSelector';
import { fetchLanguages } from '@/lib/api/languages';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));
jest.mock('@/lib/api/languages', () => ({ fetchLanguages: jest.fn() }));

function renderComponent() {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider locale="en" messages={{}}>
        <LanguageSelector />
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}

describe('LanguageSelector', () => {
  const refresh = jest.fn();
  const mockUseRouter = useRouter as jest.Mock;
  const mockUseParams = useParams as jest.Mock;
  const mockFetchLanguages = fetchLanguages as jest.Mock;
  const originalCookie = Object.getOwnPropertyDescriptor(
    Document.prototype,
    'cookie',
  )!;
  let cookieStore = '';

  beforeEach(() => {
    cookieStore = '';
    mockUseRouter.mockReturnValue({ refresh });
    mockUseParams.mockReturnValue({ locale: 'en' });
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => cookieStore,
      set: (val) => {
        cookieStore = val;
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(document, 'cookie', originalCookie);
    jest.clearAllMocks();
  });

  it('shows loading state', () => {
    mockFetchLanguages.mockReturnValue(new Promise(() => {}));
    renderComponent();
    expect(screen.getByText(/loading languages/i)).toBeInTheDocument();
  });

  it('renders languages and sets cookie on change', async () => {
    mockFetchLanguages.mockResolvedValue([
      { code: 'en', label: 'English' },
      { code: 'es', label: 'Español' },
    ]);
    renderComponent();

    const select = await screen.findByLabelText(/language/i);
    await userEvent.selectOptions(select, 'es');

    expect(cookieStore).toBe(
      'locale=es; path=/; max-age=31536000; SameSite=Lax',
    );
    expect(refresh).toHaveBeenCalled();
  });

  it('shows error state', async () => {
    mockFetchLanguages.mockRejectedValue(new Error('oops'));
    renderComponent();
    expect(
      await screen.findByText(/error loading languages/i),
    ).toBeInTheDocument();
  });
});
