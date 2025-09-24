import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import {
  bonusFixture,
  mockFetchBonuses,
  renderBonusManager,
} from './bonusTestUtils';
import { fetchBonuses, createBonus } from '@/lib/api/admin';
import { fetchBonusStats } from '@/lib/api/bonus';

jest.mock('@/lib/api/admin', () => ({
  fetchBonuses: jest.fn(),
  createBonus: jest.fn(),
  updateBonus: jest.fn(),
  deleteBonus: jest.fn(),
  fetchBonusOptions: jest.fn(),
}));
jest.mock('@/lib/api/bonus', () => ({
  fetchBonusDefaults: jest.fn(),
  fetchBonusStats: jest.fn(),
  createBonusDefaults: jest.fn(),
  updateBonusDefaults: jest.fn(),
  deleteBonusDefaults: jest.fn(),
}));
jest.mock('next-intl', () => ({
  useLocale: () => 'en',
}));
jest.mock('@/hooks/useTranslations', () => ({
  useTranslations: () => ({ data: undefined }),
}));
jest.mock('../../ui/Modal', () => ({
  __esModule: true,
  default: ({ isOpen, children }: { isOpen: boolean; children: any }) =>
    isOpen
      ? require('react').createElement('div', { role: 'dialog' }, children)
      : null,
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('BonusManager status toggle', () => {
  it('pauses a bonus and shows toast and updates status', async () => {
    mockFetchBonuses([{ ...bonusFixture }]);

    renderBonusManager();

    await screen.findByRole('button', { name: /create promotion/i });
    const pauseBtn = await screen.findByRole('button', { name: /pause/i });
    fireEvent.click(pauseBtn);
    const dialog = await screen.findByRole('dialog');
    const confirm = within(dialog).getByRole('button', {
      name: /confirm pause/i,
    });
    const cancel = within(dialog).getByRole('button', { name: /cancel/i });
    expect(confirm).toHaveClass('bg-danger-red');
    expect(cancel).toHaveClass('border');
    fireEvent.click(confirm);

    await screen.findByText('Paused "Test Bonus"');
    await screen.findByRole('button', { name: /resume/i });
  });

  it('resumes a bonus and shows toast and updates status', async () => {
    mockFetchBonuses([{ ...bonusFixture, status: 'paused' }]);

    renderBonusManager();

    await screen.findByRole('button', { name: /create promotion/i });
    const resumeBtn = await screen.findByRole('button', { name: /resume/i });
    fireEvent.click(resumeBtn);
    const dialog = await screen.findByRole('dialog');
    const confirm = within(dialog).getByRole('button', {
      name: /confirm resume/i,
    });
    const cancel = within(dialog).getByRole('button', { name: /cancel/i });
    expect(confirm).toHaveClass('bg-accent-green');
    expect(cancel).toHaveClass('border');
    fireEvent.click(confirm);

    await screen.findByText('Resumed "Test Bonus"');
    await screen.findByRole('button', { name: /pause/i });
  });
});

describe('BonusManager table manager', () => {
  it('filters and paginates bonuses', async () => {
    const bonuses = Array.from({ length: 6 }, (_, i) => ({
      ...bonusFixture,
      id: i + 1,
      name: `Promo ${i + 1}`,
      description: `desc ${i + 1}`,
    }));
    mockFetchBonuses(bonuses);

    renderBonusManager();

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

describe('BonusManager statistics', () => {
  it('renders stats returned by the API', async () => {
    mockFetchBonuses([{ ...bonusFixture }]);
    (fetchBonusStats as jest.Mock).mockResolvedValue({
      activeBonuses: 3,
      weeklyClaims: 12,
      completedPayouts: 123.45,
      currency: 'USD',
      conversionRate: 50,
    });

    renderBonusManager();

    await screen.findByRole('button', { name: /create promotion/i });
    expect(screen.getByText('3 Active')).toBeInTheDocument();
    expect(screen.getByText('$123.45')).toBeInTheDocument();
    expect(screen.getByText('50.0%')).toBeInTheDocument();
  });

  it('shows fallbacks when stats fail to load', async () => {
    mockFetchBonuses([{ ...bonusFixture }]);
    (fetchBonusStats as jest.Mock).mockRejectedValue(new Error('stats failed'));

    renderBonusManager();

    await screen.findByRole('button', { name: /create promotion/i });
    expect(await screen.findByText('stats failed')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });
});

describe('BonusManager creation and errors', () => {
  it('renders error message when bonus fetch fails', async () => {
    (fetchBonuses as jest.Mock).mockRejectedValue(new Error('fail'));

    renderBonusManager();

    expect(await screen.findByRole('alert')).toHaveTextContent('fail');
  });
});
