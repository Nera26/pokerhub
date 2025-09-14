/** @jest-environment node */

import {
  fetchProfile,
  fetchMe,
  fetchUserProfile,
  updateProfile,
  fetchStats,
} from '@/lib/api/profile';
import { apiClient, type ApiError } from '@/lib/api/client';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer();
const fetchSpy = jest.fn((input: RequestInfo, init?: RequestInit) =>
  server.fetch(input, init),
);

beforeAll(() => {
  server.listen();
  // @ts-expect-error override for tests
  global.fetch = fetchSpy;
});

afterEach(() => {
  server.resetHandlers();
  fetchSpy.mockReset();
});

afterAll(() => {
  server.close();
});

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
    fetchSpy.mockReset();
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
      const formData = new FormData();
      formData.append('username', 'NewName');

      const actualClient = jest.requireActual('@/lib/api/client').apiClient;
      mockedApiClient.mockImplementationOnce(actualClient);
      server.use(
        http.patch('http://localhost:3000/api/user/profile', () =>
          HttpResponse.json(profile),
        ),
      );

      await expect(updateProfile(formData)).resolves.toEqual(profile);
      expect(fetchSpy).toHaveBeenCalledWith(
        'http://localhost:3000/api/user/profile',
        expect.objectContaining({
          method: 'PATCH',
          body: formData,
        }),
      );
    });

    it('throws ApiError with prefixed message on failure', async () => {
      const actualClient = jest.requireActual('@/lib/api/client').apiClient;
      mockedApiClient.mockImplementationOnce(actualClient);
      server.use(
        http.patch('http://localhost:3000/api/user/profile', () =>
          HttpResponse.json(
            { message: 'boom' },
            { status: 500, statusText: 'Internal' },
          ),
        ),
      );
      await expect(updateProfile(new FormData())).rejects.toEqual(
        expect.objectContaining({
          message: 'Failed to update profile: boom',
        }),
      );
    });
  });
});
