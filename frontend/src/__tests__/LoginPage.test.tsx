import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from '@/features/login';
import { fetchAuthProviders } from '@/lib/api/auth';

jest.mock('@/app/components/auth/LoginForm', () => () => <div>Login Form</div>);
jest.mock('@/lib/api/auth', () => ({
  ...jest.requireActual('@/lib/api/auth'),
  fetchAuthProviders: jest.fn(),
}));

const fetchAuthProvidersMock = fetchAuthProviders as jest.MockedFunction<
  typeof fetchAuthProviders
>;

const popup = 'width=500,height=600';

describe('LoginPage', () => {
  let openSpy: jest.SpyInstance;
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    fetchAuthProvidersMock.mockResolvedValue([
      { name: 'google', url: '/auth/google', label: 'Google' },
      { name: 'facebook', url: '/auth/facebook', label: 'Facebook' },
    ]);
    openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    openSpy.mockRestore();
    fetchAuthProvidersMock.mockReset();
  });

  function renderPage() {
    return render(
      <QueryClientProvider client={queryClient}>
        <LoginPage />
      </QueryClientProvider>,
    );
  }

  it('links to forgot password page', () => {
    renderPage();
    expect(
      screen.getByRole('link', { name: /forgot password\?/i }),
    ).toHaveAttribute('href', '/forgot-password');
  });

  it('renders social login buttons', async () => {
    renderPage();
    expect(
      await screen.findByRole('button', { name: /google/i }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: /facebook/i }),
    ).toBeInTheDocument();
  });

  it('opens OAuth popups when buttons clicked', async () => {
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /google/i }));
    fireEvent.click(await screen.findByRole('button', { name: /facebook/i }));
    expect(openSpy).toHaveBeenNthCalledWith(
      1,
      '/auth/google',
      'GoogleLogin',
      popup,
    );
    expect(openSpy).toHaveBeenNthCalledWith(
      2,
      '/auth/facebook',
      'FacebookLogin',
      popup,
    );
  });
});
