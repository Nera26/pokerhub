import { render, screen } from '@testing-library/react';
import LoginPage from '@/features/login';
import ForgotPasswordPage from '@/features/forgot-password';

jest.mock('@/components/auth/login-form', () => () => <div>Login Form</div>);
jest.mock('@/components/auth/forgot-password-form', () => () => (
  <div>Forgot Password Form</div>
));
jest.mock('@/components/auth/social-login-buttons', () => () => (
  <div>Social Login Buttons</div>
));

describe('AuthSimplePage', () => {
  it('renders login title, form, and footer link', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByText('Login Form')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /forgot password\?/i }),
    ).toHaveAttribute('href', '/forgot-password');
  });

  it('renders forgot password title, form, and footer link', () => {
    render(<ForgotPasswordPage />);

    expect(
      screen.getByRole('heading', { name: /forgot password/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Forgot Password Form')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /back to login/i }),
    ).toHaveAttribute('href', '/login');
  });
});
