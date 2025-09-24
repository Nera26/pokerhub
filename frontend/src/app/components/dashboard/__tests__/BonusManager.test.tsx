import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import {
  bonusDefaultsFixture,
  bonusFixture,
  mockFetchBonuses,
  renderBonusManager,
} from './bonusTestUtils';
import { fetchBonuses, createBonus, updateBonus } from '@/lib/api/admin';
import {
  createBonusDefaults,
  deleteBonusDefaults,
  updateBonusDefaults,
  fetchBonusStats,
} from '@/lib/api/bonus';
import { BonusDefaultsResponseSchema } from '@shared/types';
import type { ApiError } from '@/lib/api/client';

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
jest.mock('../bonusUpdatePayload', () => ({
  buildBonusUpdatePayload: jest.fn((data) => ({
    ...data,
    expiryDate: data.expiryDate || undefined,
  })),
}));

const { buildBonusUpdatePayload } = jest.requireMock('../bonusUpdatePayload');

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
    expect(within(dialog).getByText('Pause Bonus')).toBeInTheDocument();
    expect(
      within(dialog).getByText(/are you sure you want to pause/i),
    ).toBeInTheDocument();
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
    expect(within(dialog).getByText('Resume Bonus')).toBeInTheDocument();
    expect(
      within(dialog).getByText(/are you sure you want to resume/i),
    ).toBeInTheDocument();
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

describe('BonusManager edit payload helper', () => {
  it('uses buildBonusUpdatePayload for both edit submission paths', async () => {
    mockFetchBonuses([{ ...bonusFixture }]);

    renderBonusManager();

    await screen.findByRole('button', { name: /create promotion/i });
    const editButtons = await screen.findAllByRole('button', { name: /edit/i });
    fireEvent.click(editButtons[0]);

    const dialog = await screen.findByRole('dialog');

    fireEvent.change(dialog.querySelector('#bonus-name') as HTMLInputElement, {
      target: { value: 'Helper Bonus' },
    });
    fireEvent.change(
      dialog.querySelector('#bonus-description') as HTMLTextAreaElement,
      {
        target: { value: 'Helper description' },
      },
    );
    fireEvent.change(
      dialog.querySelector('#bonus-percent') as HTMLInputElement,
      {
        target: { value: '15' },
      },
    );
    fireEvent.change(
      dialog.querySelector('#max-bonus-usd') as HTMLInputElement,
      {
        target: { value: '250' },
      },
    );
    fireEvent.change(dialog.querySelector('#expiry-date') as HTMLInputElement, {
      target: { value: '' },
    });

    fireEvent.click(
      within(dialog).getByRole('button', { name: /save changes/i }),
    );

    await waitFor(() =>
      expect(buildBonusUpdatePayload).toHaveBeenCalledTimes(1),
    );

    const firstCall = (updateBonus as jest.Mock).mock.calls[0];
    expect(firstCall[1]).toEqual(
      (buildBonusUpdatePayload as jest.Mock).mock.results[0]!.value,
    );

    fireEvent.click(await screen.findByRole('button', { name: /edit/i }));

    const reopenDialog = await screen.findByRole('dialog');
    const form = reopenDialog.querySelector('form');
    expect(form).toBeTruthy();
    fireEvent.submit(form!);

    await waitFor(() =>
      expect(buildBonusUpdatePayload).toHaveBeenCalledTimes(2),
    );

    const secondCall = (updateBonus as jest.Mock).mock.calls[1];
    expect(secondCall[1]).toEqual(
      (buildBonusUpdatePayload as jest.Mock).mock.results[1]!.value,
    );
    expect(secondCall[1]).toEqual(firstCall[1]);
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

describe('BonusManager bonus defaults', () => {
  it('saves defaults and refreshes the form', async () => {
    mockFetchBonuses([{ ...bonusFixture }]);
    const serverDefaults = BonusDefaultsResponseSchema.parse({
      ...bonusDefaultsFixture,
      name: 'Server Default',
      description: 'Server provided description',
      bonusPercent: 35,
      maxBonusUsd: 750,
      expiryDate: '2026-01-01',
    });
    (createBonusDefaults as jest.Mock).mockResolvedValue(serverDefaults);

    renderBonusManager({
      defaultsSequence: [bonusDefaultsFixture, serverDefaults],
    });

    const saveButton = await screen.findByRole('button', {
      name: /save as default/i,
    });
    fireEvent.change(screen.getByLabelText('Promotion Name'), {
      target: { value: 'Local Default' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Local description' },
    });
    fireEvent.change(screen.getByLabelText('Bonus Amount (%)'), {
      target: { value: '25' },
    });
    fireEvent.change(screen.getByLabelText('Max $'), {
      target: { value: '500' },
    });
    fireEvent.change(screen.getByLabelText('Expiry Date'), {
      target: { value: '2025-12-31' },
    });

    fireEvent.click(saveButton);

    await waitFor(() =>
      expect(document.body.innerHTML).toContain('Defaults saved'),
    );

    expect(createBonusDefaults).toHaveBeenCalledWith({
      name: 'Local Default',
      type: 'deposit',
      description: 'Local description',
      bonusPercent: 25,
      maxBonusUsd: 500,
      expiryDate: '2025-12-31',
      eligibility: 'all',
      status: 'active',
    });

    await waitFor(() =>
      expect(screen.getByLabelText('Promotion Name')).toHaveValue(
        serverDefaults.name,
      ),
    );
    await waitFor(() =>
      expect(screen.getByLabelText('Bonus Amount (%)')).toHaveValue(35),
    );
  });

  it('falls back to updating defaults when create returns conflict', async () => {
    mockFetchBonuses([{ ...bonusFixture }]);
    const serverDefaults = BonusDefaultsResponseSchema.parse({
      ...bonusDefaultsFixture,
      name: 'Conflict Default',
      description: 'Conflict description',
    });
    (createBonusDefaults as jest.Mock).mockImplementationOnce(() =>
      Promise.reject({ status: 409 } as ApiError),
    );
    (updateBonusDefaults as jest.Mock).mockResolvedValue(serverDefaults);

    renderBonusManager({
      defaultsSequence: [bonusDefaultsFixture, serverDefaults],
    });

    const saveDefaultsButton = await screen.findByRole('button', {
      name: /save as default/i,
    });
    expect(saveDefaultsButton).not.toBeDisabled();
    fireEvent.change(await screen.findByLabelText('Promotion Name'), {
      target: { value: 'Conflict attempt' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Conflict description' },
    });

    fireEvent.click(saveDefaultsButton);

    await waitFor(() =>
      expect(updateBonusDefaults).toHaveBeenCalledWith({
        name: 'Conflict attempt',
        type: 'deposit',
        description: 'Conflict description',
        bonusPercent: undefined,
        maxBonusUsd: undefined,
        expiryDate: undefined,
        eligibility: 'all',
        status: 'active',
      }),
    );

    await waitFor(() =>
      expect(screen.getByLabelText('Promotion Name')).toHaveValue(
        serverDefaults.name,
      ),
    );
  });

  it('resets defaults and reloads latest values', async () => {
    mockFetchBonuses([{ ...bonusFixture }]);
    const updatedDefaults = BonusDefaultsResponseSchema.parse({
      ...bonusDefaultsFixture,
      name: 'Reset Default',
      description: 'After reset',
    });
    (deleteBonusDefaults as jest.Mock).mockResolvedValue({ message: 'ok' });

    renderBonusManager({
      defaultsSequence: [bonusDefaultsFixture, updatedDefaults],
    });

    fireEvent.click(
      await screen.findByRole('button', { name: /reset defaults/i }),
    );

    await screen.findByText('Defaults reset');

    await waitFor(() =>
      expect(screen.getByLabelText('Promotion Name')).toHaveValue(
        updatedDefaults.name,
      ),
    );
    expect(deleteBonusDefaults).toHaveBeenCalledTimes(1);
  });
});
