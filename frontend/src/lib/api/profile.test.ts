/** @jest-environment node */

import { fetchProfile, fetchMe, fetchUserProfile } from './profile';
import { apiClient, type ApiError } from '@/lib/api/client';

jest.mock('@/lib/api/client', () => ({
  apiClient: jest.fn(),
}));

const mockedApiClient = apiClient as jest.MockedFunction<typeof apiClient>;

describe('profile API', () => {
  beforeEach(() => {
    mockedApiClient.mockReset();
  });

  describe('fetchProfile', () => {
    it('returns profile data on success', async () => {
      const profile = {
        username: 'PlayerOne23',
        email: 'playerone23@example.com',
        avatarUrl: 'avatar.jpg',
        bank: '\u2022\u2022\u2022\u2022 1234',
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

  describe('fetchUserProfile', () => {
    it('returns profile data on success', async () => {
      const profile = {
        username: 'PlayerOne23',
        email: 'playerone23@example.com',
        avatarUrl: 'avatar.jpg',
        bank: '\u2022\u2022\u2022\u2022 1234',
        location: 'United States',
        joined: '2023-01-15T00:00:00.000Z',
        bio: 'Texas grinder',
        experience: 42,
        balance: 100,
      };
      mockedApiClient.mockResolvedValueOnce(profile);

      await expect(fetchUserProfile('alice')).resolves.toEqual(profile);
      expect(mockedApiClient).toHaveBeenCalledWith(
        '/api/user/alice/profile',
        expect.anything(),
        { signal: undefined },
      );
    });

    it('throws ApiError with prefixed message on failure', async () => {
      mockedApiClient.mockRejectedValueOnce({ message: 'boom' } as ApiError);

      await expect(fetchUserProfile('alice')).rejects.toEqual({
        message: 'Failed to fetch user profile: boom',
      });
    });
  });

  describe('fetchMe', () => {
    it('returns user data on success', async () => {
      const me = { avatarUrl: 'avatar.jpg' };
      mockedApiClient.mockResolvedValueOnce(me);

      await expect(fetchMe()).resolves.toEqual(me);
      expect(mockedApiClient).toHaveBeenCalledWith(
        '/api/me',
        expect.anything(),
        { signal: undefined },
      );
    });

    it('throws ApiError with prefixed message on failure', async () => {
      mockedApiClient.mockRejectedValueOnce({ message: 'boom' } as ApiError);

      await expect(fetchMe()).rejects.toEqual({
        message: 'Failed to fetch profile: boom',
      });
    });
  });
});
