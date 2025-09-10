import { render, screen, fireEvent } from '@testing-library/react';
import LoginPage from '@/features/login';

jest.mock('@/app/components/auth/LoginForm', () => () => <div>Login Form</div>);

const popup = 'width=500,height=600';

describe('LoginPage', () => {
  let openSpy: jest.SpyInstance;

  beforeEach(() => {
    openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    openSpy.mockRestore();
  });

  it('links to forgot password page', () => {
    render(<LoginPage />);
    expect(
      screen.getByRole('link', { name: /forgot password\?/i }),
    ).toHaveAttribute('href', '/forgot-password');
  });

  it('renders social login buttons', () => {
    render(<LoginPage />);
    expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /facebook/i }),
    ).toBeInTheDocument();
  });

  it('opens OAuth popups when buttons clicked', () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: /google/i }));
    fireEvent.click(screen.getByRole('button', { name: /facebook/i }));
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
