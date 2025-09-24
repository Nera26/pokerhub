import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import {
  bonusFixture,
  mockFetchBonuses,
  renderBonusManager,
} from './bonusTestUtils';
import { fetchBonuses, createBonus } from '@/lib/api/admin';

jest.mock('@/lib/api/admin', () => ({
  fetchBonuses: jest.fn(),
  createBonus: jest.fn(),
  updateBonus: jest.fn(),
  deleteBonus: jest.fn(),
  fetchBonusOptions: jest.fn(),
}));
jest.mock('@/lib/api/bonus', () => ({
  fetchBonusDefaults: jest.fn(),
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

describe('BonusManager creation and errors', () => {
  it('renders error message when bonus fetch fails', async () => {
    (fetchBonuses as jest.Mock).mockRejectedValue(new Error('fail'));

    renderBonusManager();

    expect(await screen.findByRole('alert')).toHaveTextContent('fail');
  });
});
