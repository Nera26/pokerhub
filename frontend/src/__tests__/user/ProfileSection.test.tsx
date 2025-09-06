import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProfileSection from '@/app/components/user/ProfileSection';
import { fetchTiers } from '@/lib/api/tiers';
import type { UserProfile } from '@shared/types';

jest.mock('@/lib/api/tiers');

describe('ProfileSection', () => {
  function renderWithClient(ui: React.ReactElement) {
    const client = new QueryClient();
    return render(
      <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
    );
  }

  it('calculates tier and progress from API', async () => {
    (fetchTiers as jest.Mock).mockResolvedValue([
      { name: 'Bronze', min: 0, max: 999 },
      { name: 'Silver', min: 1000, max: 4999 },
      { name: 'Gold', min: 5000, max: 9999 },
    ]);
    const profile: UserProfile = {
      username: 'PlayerOne23',
      email: 'player@example.com',
      avatarUrl: 'https://example.com/avatar.jpg',
      bank: '•••• 1234',
      location: 'US',
      joined: '2023-01-01T00:00:00.000Z',
      bio: 'bio',
      experience: 1500,
      balance: 100,
    };
    const { container } = renderWithClient(
      <ProfileSection profile={profile} onEdit={() => {}} />,
    );
    expect(await screen.findByText('Silver')).toBeInTheDocument();
    const bar = container.querySelector('.bg-accent-green') as HTMLElement;
    expect(bar.style.width).toBe('13%');
  });
});
