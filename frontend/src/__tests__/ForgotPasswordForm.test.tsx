import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ForgotPasswordForm from '@/app/components/auth/ForgotPasswordForm';
import {
  requestPasswordReset,
  verifyResetCode,
  resetPassword,
} from '@/lib/api/auth';

jest.mock('@/lib/api/auth', () => ({
  requestPasswordReset: jest.fn(),
  verifyResetCode: jest.fn(),
  resetPassword: jest.fn(),
}));

describe('ForgotPasswordForm', () => {
  function renderWithClient(ui: React.ReactElement) {
    const queryClient = new QueryClient();
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    );
  }
  const mockRequest = requestPasswordReset as jest.MockedFunction<
    typeof requestPasswordReset
  >;
  const mockVerify = verifyResetCode as jest.MockedFunction<
    typeof verifyResetCode
  >;
  const mockReset = resetPassword as jest.MockedFunction<typeof resetPassword>;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows validation error for empty email', async () => {
    const user = userEvent.setup();
    renderWithClient(<ForgotPasswordForm />);

    await user.click(screen.getByRole('button', { name: /Send Code/i }));

    expect(await screen.findByText('Email is required')).toBeInTheDocument();
  });

  it('advances to code verification step on successful request', async () => {
    mockRequest.mockResolvedValueOnce({ message: 'sent' });

    const user = userEvent.setup();
    renderWithClient(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /Send Code/i }));

    expect(mockRequest).toHaveBeenCalledWith('test@example.com');
    expect(await screen.findByText('Enter 6-digit Code')).toBeInTheDocument();
  });

  it('shows validation error for empty code', async () => {
    mockRequest.mockResolvedValueOnce({ message: '' });

    const user = userEvent.setup();
    renderWithClient(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /Send Code/i }));

    const verifyBtn = await screen.findByRole('button', {
      name: /Verify Code/i,
    });
    await user.click(verifyBtn);

    expect(await screen.findByText('Code is required')).toBeInTheDocument();
  });

  it('shows password mismatch error in reset step', async () => {
    mockRequest.mockResolvedValueOnce({ message: '' });
    mockVerify.mockResolvedValueOnce({ message: '' });

    const user = userEvent.setup();
    renderWithClient(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /Send Code/i }));
    const codeInput = await screen.findByLabelText('Enter 6-digit Code');
    await user.type(codeInput, '123456');
    await user.click(screen.getByRole('button', { name: /Verify Code/i }));

    const pwdInput = await screen.findByLabelText('New Password');
    const confirmInput = screen.getByLabelText('Confirm Password');
    await user.type(pwdInput, 'password1');
    await user.type(confirmInput, 'password2');
    await user.click(screen.getByRole('button', { name: /Reset Password/i }));

    expect(
      await screen.findByText('Passwords do not match'),
    ).toBeInTheDocument();
    expect(mockRequest).toHaveBeenCalledTimes(1);
    expect(mockVerify).toHaveBeenCalledTimes(1);
    expect(mockReset).not.toHaveBeenCalled();
  });

  it('displays API email error on request failure', async () => {
    mockRequest.mockRejectedValueOnce({
      errors: { email: 'No user with that email' },
      message: 'Request failed',
    });

    const user = userEvent.setup();
    renderWithClient(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /Send Code/i }));

    expect(
      await screen.findByText('No user with that email'),
    ).toBeInTheDocument();
  });

  it('shows error message for unexpected failures', async () => {
    mockRequest.mockRejectedValueOnce(new Error('Network error'));

    const user = userEvent.setup();
    renderWithClient(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /Send Code/i }));

    expect(await screen.findByText('Network error')).toBeInTheDocument();
  });

  it('calls reset APIs and shows success message', async () => {
    mockRequest.mockResolvedValueOnce({ message: 'sent' });
    mockVerify.mockResolvedValueOnce({ message: 'verified' });
    mockReset.mockResolvedValueOnce({ message: 'Password reset successfully.' });

    const user = userEvent.setup();
    renderWithClient(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /Send Code/i }));
    await user.type(
      await screen.findByLabelText('Enter 6-digit Code'),
      '123456',
    );
    await user.click(screen.getByRole('button', { name: /Verify Code/i }));
    await user.type(
      await screen.findByLabelText('New Password'),
      'newpass',
    );
    await user.type(screen.getByLabelText('Confirm Password'), 'newpass');
    await user.click(screen.getByRole('button', { name: /Reset Password/i }));

    expect(mockRequest).toHaveBeenCalledWith('test@example.com');
    expect(mockVerify).toHaveBeenCalled();
    expect(mockReset).toHaveBeenCalled();
    expect(
      await screen.findByText('Password reset successfully.'),
    ).toBeInTheDocument();
  });

  it('shows reset error message when API fails', async () => {
    mockRequest.mockResolvedValueOnce({ message: 'sent' });
    mockVerify.mockResolvedValueOnce({ message: 'verified' });
    mockReset.mockRejectedValueOnce({ message: 'Reset failed' });

    const user = userEvent.setup();
    renderWithClient(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /Send Code/i }));
    await user.type(
      await screen.findByLabelText('Enter 6-digit Code'),
      '123456',
    );
    await user.click(screen.getByRole('button', { name: /Verify Code/i }));
    await user.type(
      await screen.findByLabelText('New Password'),
      'newpass',
    );
    await user.type(screen.getByLabelText('Confirm Password'), 'newpass');
    await user.click(screen.getByRole('button', { name: /Reset Password/i }));

    expect(mockReset).toHaveBeenCalled();
    expect(await screen.findByText('Reset failed')).toBeInTheDocument();
  });
});
