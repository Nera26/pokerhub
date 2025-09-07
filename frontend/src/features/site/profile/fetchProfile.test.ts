/** @jest-environment node */

import { fetchProfile } from './fetchProfile';
import { apiClient, type ApiError } from '@/lib/api/client';

jest.mock('@/lib/api/client', () => ({
  apiClient: jest.fn(),
}));

const mockedApiClient = apiClient as jest.MockedFunction<typeof apiClient>;

describe('fetchProfile', () => {
  it('returns profile data on success', async () => {
    const profile = {
      username: 'PlayerOne23',
      email: 'playerone23@example.com',
      avatarUrl: 'avatar.jpg',
      bank: '•••• 1234',
      location: 'United States',
      joined: '2023-01-15T00:00:00.000Z',
      bio: 'Texas grinder',
      experience: 42,
      balance: 100,
    };
    mockedApiClient.mockResolvedValueOnce(profile);

    await expect(fetchProfile()).resolves.toEqual(profile);
    expect(mockedApiClient).toHaveBeenCalledWith(
      '/api/user/profile',
      expect.anything(),
      { signal: undefined },
    );
  });

  it('throws ApiError with prefixed message on failure', async () => {
    mockedApiClient.mockRejectedValueOnce({ message: 'boom' } as ApiError);

    await expect(fetchProfile()).rejects.toEqual({
      message: 'Failed to fetch profile: boom',
    });
  });
});
