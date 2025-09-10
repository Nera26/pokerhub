import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithClient } from './renderWithClient';
import BonusManager from '../BonusManager';
import {
  fetchBonuses,
  updateBonus,
  createBonus,
  deleteBonus,
  fetchBonusOptions,
} from '@/lib/api/admin';

jest.mock('@/lib/api/admin', () => ({
  fetchBonuses: jest.fn(),
  createBonus: jest.fn(),
  updateBonus: jest.fn(),
  deleteBonus: jest.fn(),
  fetchBonusOptions: jest.fn(),
}));

describe('BonusManager status toggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchBonusOptions as jest.Mock).mockResolvedValue({
      types: [{ value: 'deposit', label: 'Deposit Match' }],
      eligibilities: [{ value: 'all', label: 'All Players' }],
      statuses: [
        { value: 'active', label: 'Active' },
        { value: 'paused', label: 'Paused' },
      ],
    });
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
    (fetchBonuses as jest.Mock).mockImplementation(() =>
      Promise.resolve(bonuses),
    );
    (updateBonus as jest.Mock).mockImplementation((id: number, data: any) => {
      bonuses = bonuses.map((b) => (b.id === id ? { ...b, ...data } : b));
      return Promise.resolve({});
    });

    renderWithClient(<BonusManager />);

    const pauseBtn = await screen.findByRole('button', { name: /pause/i });
    fireEvent.click(pauseBtn);
    const confirm = await screen.findByRole('button', {
      name: /confirm pause/i,
    });
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
    (fetchBonuses as jest.Mock).mockImplementation(() =>
      Promise.resolve(bonuses),
    );
    (updateBonus as jest.Mock).mockImplementation((id: number, data: any) => {
      bonuses = bonuses.map((b) => (b.id === id ? { ...b, ...data } : b));
      return Promise.resolve({});
    });

    renderWithClient(<BonusManager />);

    const resumeBtn = await screen.findByRole('button', { name: /resume/i });
    fireEvent.click(resumeBtn);
    const confirm = await screen.findByRole('button', {
      name: /confirm resume/i,
    });
    fireEvent.click(confirm);

    await screen.findByText('Resumed "Test Bonus"');
    await screen.findByRole('button', { name: /pause/i });
  });
});

describe('BonusManager table manager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('filters and paginates bonuses', async () => {
    const bonuses = Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      name: `Promo ${i + 1}`,
      type: 'deposit',
      description: `desc ${i + 1}`,
      bonusPercent: 10,
      maxBonusUsd: 100,
      expiryDate: undefined,
      eligibility: 'all',
      status: 'active',
      claimsTotal: 0,
      claimsWeek: 0,
    }));
    (fetchBonuses as jest.Mock).mockResolvedValue(bonuses);

    renderWithClient(<BonusManager />);

    // first page renders first 5 rows
    await screen.findByText('Promo 1');
    expect(screen.queryByText('Promo 6')).not.toBeInTheDocument();

    // go to next page
    fireEvent.click(screen.getByRole('button', { name: /next page/i }));
    await screen.findByText('Promo 6');

    // search filters results
    const searchInput = screen.getByPlaceholderText('Search promotions...');
    fireEvent.change(searchInput, { target: { value: 'Promo 3' } });
    await waitFor(() =>
      expect(screen.getByText('Promo 3')).toBeInTheDocument(),
    );
    expect(screen.queryByText('Promo 6')).not.toBeInTheDocument();
  });
});

describe('BonusManager creation and errors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchBonusOptions as jest.Mock).mockResolvedValue({
      types: [{ value: 'deposit', label: 'Deposit Match' }],
      eligibilities: [{ value: 'all', label: 'All Players' }],
      statuses: [
        { value: 'active', label: 'Active' },
        { value: 'paused', label: 'Paused' },
      ],
    });
  });

  it('creates a promotion and shows success toast', async () => {
    (fetchBonuses as jest.Mock).mockResolvedValue([]);
    (createBonus as jest.Mock).mockResolvedValue({});

    renderWithClient(<BonusManager />);

    fireEvent.change(screen.getByPlaceholderText('Enter promotion name...'), {
      target: { value: 'New Promo' },
    });
    fireEvent.change(
      screen.getByPlaceholderText('Enter promotion description...'),
      { target: { value: 'Amazing offer' } },
    );

    fireEvent.click(screen.getByRole('button', { name: /create promotion/i }));

    await screen.findByText('Promotion created');

    expect(createBonus).toHaveBeenCalledWith({
      name: 'New Promo',
      type: 'deposit',
      description: 'Amazing offer',
      bonusPercent: undefined,
      maxBonusUsd: undefined,
      expiryDate: undefined,
      eligibility: 'all',
      status: 'active',
    });
  });

  it('renders error message when bonus fetch fails', async () => {
    (fetchBonuses as jest.Mock).mockRejectedValue(new Error('fail'));

    renderWithClient(<BonusManager />);

    expect(await screen.findByRole('alert')).toHaveTextContent('fail');
  });
});
