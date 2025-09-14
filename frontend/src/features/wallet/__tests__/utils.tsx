import type { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

export const sampleIbanDetails = {
  ibanMasked: '***123',
  ibanFull: 'DE001',
  holder: 'John Doe',
  instructions: '',
  history: [],
  lastUpdatedBy: 'admin',
  lastUpdatedAt: '2024-01-01T00:00:00Z',
  bankName: 'Test Bank',
  bankAddress: '123 Street',
};

export async function renderAndOpenWithdraw(ui: ReactElement) {
  render(ui);
  await userEvent.click(screen.getByRole('button', { name: /withdraw/i }));
}

export async function expectBankDetailsShown(
  bankName = 'Test Bank',
  masked = '***123',
) {
  expect(await screen.findByText(bankName)).toBeInTheDocument();
  expect(screen.getByText(masked)).toBeInTheDocument();
}
