import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

export async function submitEmailForm(
  user: ReturnType<typeof userEvent.setup>,
  email: string,
) {
  await user.type(await screen.findByLabelText('Email Address'), email);
  await user.click(screen.getByRole('button', { name: /Send Code/i }));
}

export async function submitCodeForm(
  user: ReturnType<typeof userEvent.setup>,
  code: string,
) {
  await user.type(await screen.findByLabelText('Enter 6-digit Code'), code);
  await user.click(screen.getByRole('button', { name: /Verify Code/i }));
}

export async function submitResetForm(
  user: ReturnType<typeof userEvent.setup>,
  password: string,
  confirmPassword = password,
) {
  await user.type(await screen.findByLabelText('New Password'), password);
  await user.type(
    await screen.findByLabelText('Confirm Password'),
    confirmPassword,
  );
  await user.click(screen.getByRole('button', { name: /Reset Password/i }));
}
