import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginForm from '@/app/components/auth/LoginForm';
import { useRouter } from 'next/navigation';
import { useAuthActions } from '@/app/store/authStore';
import { login, type ApiError } from '@/lib/api/auth';

type UseAuthActions = typeof useAuthActions;

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/app/store/authStore', () => ({
  useAuthActions: jest.fn(),
}));

jest.mock('@/lib/api/auth', () => ({
  login: jest.fn(),
}));

describe('LoginForm', () => {
  function renderWithClient(ui: React.ReactElement) {
    const queryClient = new QueryClient();
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    );
  }

  async function fillCredentials(
    user: ReturnType<typeof userEvent.setup>,
    email = 'test@example.com',
    password = 'password',
  ) {
    await user.type(screen.getByLabelText('Email Address'), email);
    await user.type(screen.getByLabelText('Password'), password);
  }

  async function submitLogin(user: ReturnType<typeof userEvent.setup>) {
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /login/i }));
    });
  }

  const push = jest.fn<void, [string]>();
  const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
  const mockUseAuthActions =
    useAuthActions as jest.MockedFunction<UseAuthActions>;
  const setToken = jest.fn();
  const clearToken = jest.fn();
  const setAvatarUrl = jest.fn();
  const mockLogin = login as jest.MockedFunction<typeof login>;

  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push,
    } as unknown as ReturnType<typeof useRouter>);

    mockUseAuthActions.mockReturnValue({ setToken, clearToken, setAvatarUrl });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows validation errors for empty fields', async () => {
    renderWithClient(<LoginForm />);
    await userEvent.click(screen.getByRole('button', { name: /login/i }));
    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(await screen.findByText('Password is required')).toBeInTheDocument();
  });

  it('submits valid credentials', async () => {
    mockLogin.mockResolvedValueOnce({ token: 'abc' });

    const user = userEvent.setup();
    renderWithClient(<LoginForm />);

    await fillCredentials(user);
    await submitLogin(user);

    await waitFor(() => expect(setToken).toHaveBeenCalledWith('abc'));
    expect(push).toHaveBeenCalledWith('/');
    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password');
  });

  describe('error scenarios', () => {
    const cases: Array<{
      name: string;
      error: unknown;
      assertions: () => Promise<void>;
    }> = [
      {
        name: 'API field errors on failed login',
        error: {
          details: JSON.stringify({
            errors: { email: 'Bad email', password: 'Bad password' },
            message: 'Invalid credentials',
          }),
        } as ApiError,
        assertions: async () => {
          expect(await screen.findByText('Bad email')).toBeInTheDocument();
          expect(await screen.findByText('Bad password')).toBeInTheDocument();
          expect(
            await screen.findByText('Invalid credentials'),
          ).toBeInTheDocument();
        },
      },
      {
        name: 'unexpected failures',
        error: new Error('Network error'),
        assertions: async () => {
          expect(await screen.findByText('Network error')).toBeInTheDocument();
        },
      },
    ];

    it.each(cases)('$name', async ({ error, assertions }) => {
      mockLogin.mockImplementationOnce(async () => {
        throw error;
      });

      const user = userEvent.setup();
      renderWithClient(<LoginForm />);

      await fillCredentials(user);
      await submitLogin(user);

      await waitFor(() => expect(mockLogin).toHaveBeenCalled());
      await assertions();
    });
  });

  it('only re-renders when setToken reference changes', () => {
    const listeners = new Set<() => void>();
    let store = { setToken, clearToken };

    mockUseAuthActions.mockImplementation(() => {
      const { useState, useEffect, useRef } = require('react');
      const [selected, setSelected] = useState(store);
      const selectedRef = useRef(selected);
      selectedRef.current = selected;

      useEffect(() => {
        const listener = () => {
          if (
            store.setToken !== selectedRef.current.setToken ||
            store.clearToken !== selectedRef.current.clearToken
          ) {
            setSelected(store);
          }
        };
        listeners.add(listener);
        return () => listeners.delete(listener);
      }, []);

      return selected;
    });

    renderWithClient(<LoginForm />);
    const initialCalls = mockUseAuthActions.mock.calls.length;

    // No change -> no re-render
    act(() => {
      listeners.forEach((l) => l());
    });
    expect(mockUseAuthActions.mock.calls.length).toBe(initialCalls);

    // Change setToken reference -> re-render happens
    act(() => {
      store = { setToken: jest.fn(), clearToken };
      listeners.forEach((l) => l());
    });
    expect(mockUseAuthActions.mock.calls.length).toBe(initialCalls + 1);
  });
});
