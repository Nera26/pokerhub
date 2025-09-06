/** @jest-environment node */

import { fetchBroadcasts, sendBroadcast } from '@/lib/api/broadcasts';
import { serverFetch } from '@/lib/server-fetch';

jest.mock('@/lib/server-fetch', () => ({
  serverFetch: jest.fn(),
}));

describe('broadcasts api', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('fetches and sends broadcasts', async () => {
    (serverFetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ broadcasts: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: { get: () => 'application/json' },
        json: async () => ({
          id: '1',
          type: 'announcement',
          text: 'hi',
          urgent: false,
          timestamp: '2020-01-01T00:00:00.000Z',
        }),
      });

    await expect(fetchBroadcasts()).resolves.toEqual({ broadcasts: [] });
    await expect(
      sendBroadcast({ type: 'announcement', text: 'hi', urgent: false, sound: true })
    ).resolves.toEqual({
      id: '1',
      type: 'announcement',
      text: 'hi',
      urgent: false,
      timestamp: '2020-01-01T00:00:00.000Z',
    });
  });

  it('throws ApiError on failure', async () => {
    (serverFetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      headers: { get: () => 'application/json' },
      json: async () => ({ error: 'fail' }),
    });

    await expect(fetchBroadcasts()).rejects.toMatchObject({
      status: 500,
      message: 'Server Error',
    });
    await expect(
      sendBroadcast({ type: 'announcement', text: 'x', urgent: false, sound: true })
    ).rejects.toMatchObject({ status: 500, message: 'Server Error' });
  });
});
