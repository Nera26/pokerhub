import { render, screen } from '@testing-library/react';
import LoginPage from '@/features/login';

jest.mock('@/app/components/auth/LoginForm', () => () => <div>Login Form</div>);

describe('LoginPage', () => {
  it('links to forgot password page', () => {
    render(<LoginPage />);
    expect(
      screen.getByRole('link', { name: /forgot password\?/i }),
    ).toHaveAttribute('href', '/forgot-password');
  });
});
