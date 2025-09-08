import { render } from '@testing-library/react';
import LoginPage from '@/features/login';
import ForgotPasswordPage from '@/features/forgot-password';

jest.mock('@/app/components/auth/LoginForm', () => () => <div>Login Form</div>);
jest.mock('@/app/components/auth/ForgotPasswordForm', () => () => <div>Forgot Password Form</div>);

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), prefetch: jest.fn() }),
}));

describe('AuthPageLayout', () => {
  it('renders login page correctly', () => {
    const { container } = render(<LoginPage />);
    expect(container).toMatchSnapshot();
  });

  it('renders forgot password page correctly', () => {
    const { container } = render(<ForgotPasswordPage />);
    expect(container).toMatchSnapshot();
  });
});
