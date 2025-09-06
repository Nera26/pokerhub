/** @jest-environment node */

import { fetchProfile } from '@/lib/api/profile';
import { apiClient, type ApiError } from '@/lib/api/client';

jest.mock('@/lib/api/client', () => ({
  apiClient: jest.fn(),
}));

const mockedApiClient = apiClient as jest.MockedFunction<typeof apiClient>;

describe('fetchProfile', () => {
  it('returns profile data on success', async () => {
    mockedApiClient.mockResolvedValueOnce({ experience: 42 });

    await expect(fetchProfile()).resolves.toEqual({ experience: 42 });
    expect(mockedApiClient).toHaveBeenCalledWith(
      '/api/profile',
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
