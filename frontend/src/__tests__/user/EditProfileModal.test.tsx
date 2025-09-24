import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ComponentProps } from 'react';
import EditProfileModal from '@/app/components/user/EditProfileModal';
import { fetchTiers } from '@/lib/api/tiers';
import type { Tier, UserProfile } from '@shared/types';

jest.mock('@/lib/api/tiers');

describe('EditProfileModal', () => {
  const profile: UserProfile = {
    username: 'PlayerOne23',
    email: 'player@example.com',
    avatarUrl: 'https://example.com/avatar.jpg',
    bank: '•••• 1234',
    location: 'US',
    joined: '2023-01-01T00:00:00.000Z',
    bio: 'bio',
    experience: 1500,
    balance: 1000,
  };

  const tiers: Tier[] = [
    { name: 'Bronze', min: 0, max: 999 },
    { name: 'Silver', min: 1000, max: 4999 },
    { name: 'Gold', min: 5000, max: null },
  ];

  function renderModal(
    overrides: Partial<ComponentProps<typeof EditProfileModal>> = {},
  ) {
    const client = new QueryClient();
    return render(
      <QueryClientProvider client={client}>
        <EditProfileModal
          isOpen
          onClose={() => {}}
          onSave={() => {}}
          profile={profile}
          {...overrides}
        />
      </QueryClientProvider>,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders tier progress using API data', async () => {
    (fetchTiers as jest.Mock).mockResolvedValue(tiers);
    renderModal();

    expect(await screen.findByText('Silver')).toBeInTheDocument();
    const bar = screen.getByTestId('tier-progress-bar');
    expect(bar).toHaveStyle({ width: '13%' });
    const target = tiers[2]?.min ?? profile.experience;
    const expLabel = `EXP: ${profile.experience.toLocaleString()} / ${target.toLocaleString()}`;
    expect(screen.getByText(expLabel)).toBeInTheDocument();
  });

  it('hides the progress bar while parent indicates loading', async () => {
    (fetchTiers as jest.Mock).mockResolvedValue(tiers);
    renderModal({ isTierLoading: true });

    expect(
      await screen.findByText('Loading tier progress...'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('tier-progress-bar')).not.toBeInTheDocument();
  });

  it('shows a fallback message when tiers are unavailable', async () => {
    (fetchTiers as jest.Mock).mockResolvedValue([]);
    renderModal();

    expect(
      await screen.findByText('Tier data unavailable'),
    ).toBeInTheDocument();
  });
});
