/** @jest-environment node */

import {
  fetchProfile,
  fetchMe,
  fetchUserProfile,
  updateProfile,
  fetchStats,
} from '@/lib/api/profile';
import { apiClient, type ApiError } from '@/lib/api/client';
import { mockFetch } from '@/test-utils/mockFetch';

jest.mock('@/lib/api/client', () => {
  const actual = jest.requireActual('@/lib/api/client');
  return {
    ...actual,
    apiClient: jest.fn(),
  };
});

const mockedApiClient = apiClient as jest.MockedFunction<typeof apiClient>;

describe('profile API', () => {
  beforeEach(() => {
    mockedApiClient.mockReset();
    (global.fetch as jest.Mock | undefined)?.mockReset?.();
  });

  describe('fetchProfile', () => {
    it('returns profile data on success', async () => {
      const profile = {
        username: 'PlayerOne23',
        email: 'playerone23@example.com',
        avatarUrl: 'avatar.jpg',
        bank: '\\u2022\\u2022\\u2022\\u2022 1234',
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

  describe('fetchStats', () => {
    it('returns stats on success', async () => {
      const stats = {
        handsPlayed: 10,
        winRate: 50,
        tournamentsPlayed: 2,
        topThreeRate: 30,
      };
      mockedApiClient.mockResolvedValueOnce(stats);

      await expect(fetchStats()).resolves.toEqual(stats);
      expect(mockedApiClient).toHaveBeenCalledWith(
        '/api/user/profile/stats',
        expect.anything(),
        { signal: undefined },
      );
    });

    it('throws ApiError with prefixed message on failure', async () => {
      mockedApiClient.mockRejectedValueOnce({ message: 'boom' } as ApiError);

      await expect(fetchStats()).rejects.toEqual({
        message: 'Failed to fetch profile stats: boom',
      });
    });
  });

  describe('fetchUserProfile', () => {
    it('returns profile data on success', async () => {
      const profile = {
        username: 'PlayerOne23',
        email: 'playerone23@example.com',
        avatarUrl: 'avatar.jpg',
        bank: '\\u2022\\u2022\\u2022\\u2022 1234',
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

  describe('updateProfile', () => {
    it('sends PATCH request and returns updated profile', async () => {
      const profile = {
        username: 'NewName',
        email: 'new@example.com',
        avatarUrl: 'avatar.jpg',
        bank: '1234',
        location: 'United States',
        joined: '2023-01-15T00:00:00.000Z',
        bio: 'Texas grinder',
        experience: 42,
        balance: 100,
      };
      mockFetch({ status: 200, payload: profile });

      const formData = new FormData();
      formData.append('username', 'NewName');

      await expect(updateProfile(formData)).resolves.toEqual(profile);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/user/profile',
        expect.objectContaining({
          method: 'PATCH',
          body: formData,
        }),
      );
    });

    it('throws ApiError with prefixed message on failure', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal',
        headers: { get: () => 'application/json' },
        json: async () => ({ message: 'boom' }),
      });
      await expect(updateProfile(new FormData())).rejects.toEqual(
        expect.objectContaining({
          message: 'Failed to update profile: boom',
        }),
      );
    });
  });
});
