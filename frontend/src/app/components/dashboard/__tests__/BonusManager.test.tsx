import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BonusManager from '../BonusManager';
import { fetchBonuses, updateBonus, createBonus, deleteBonus } from '@/lib/api/admin';

jest.mock('@/lib/api/admin', () => ({
  fetchBonuses: jest.fn(),
  createBonus: jest.fn(),
  updateBonus: jest.fn(),
  deleteBonus: jest.fn(),
}));

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('BonusManager status toggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('pauses a bonus and shows toast and updates status', async () => {
    let bonuses = [
      {
        id: 1,
        name: 'Test Bonus',
        type: 'deposit',
        description: 'desc',
        bonusPercent: 10,
        maxBonusUsd: 100,
        expiryDate: undefined,
        eligibility: 'all',
        status: 'active',
        claimsTotal: 0,
        claimsWeek: 0,
      },
    ];
    (fetchBonuses as jest.Mock).mockImplementation(() => Promise.resolve(bonuses));
    (updateBonus as jest.Mock).mockImplementation((id: number, data: any) => {
      bonuses = bonuses.map((b) => (b.id === id ? { ...b, ...data } : b));
      return Promise.resolve({});
    });

    renderWithClient(<BonusManager />);

    const pauseBtn = await screen.findByRole('button', { name: /pause/i });
    fireEvent.click(pauseBtn);
    const confirm = await screen.findByRole('button', { name: /confirm pause/i });
    fireEvent.click(confirm);

    await screen.findByText('Paused "Test Bonus"');
    await screen.findByRole('button', { name: /resume/i });
  });

  it('resumes a bonus and shows toast and updates status', async () => {
    let bonuses = [
      {
        id: 1,
        name: 'Test Bonus',
        type: 'deposit',
        description: 'desc',
        bonusPercent: 10,
        maxBonusUsd: 100,
        expiryDate: undefined,
        eligibility: 'all',
        status: 'paused',
        claimsTotal: 0,
        claimsWeek: 0,
      },
    ];
    (fetchBonuses as jest.Mock).mockImplementation(() => Promise.resolve(bonuses));
    (updateBonus as jest.Mock).mockImplementation((id: number, data: any) => {
      bonuses = bonuses.map((b) => (b.id === id ? { ...b, ...data } : b));
      return Promise.resolve({});
    });

    renderWithClient(<BonusManager />);

    const resumeBtn = await screen.findByRole('button', { name: /resume/i });
    fireEvent.click(resumeBtn);
    const confirm = await screen.findByRole('button', { name: /confirm resume/i });
    fireEvent.click(confirm);

    await screen.findByText('Resumed "Test Bonus"');
    await screen.findByRole('button', { name: /pause/i });
  });
});

