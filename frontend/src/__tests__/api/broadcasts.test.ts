/** @jest-environment node */

import {
  fetchBroadcasts,
  sendBroadcast,
  fetchBroadcastTemplates,
} from '@/lib/api/broadcasts';
import { mockFetchError } from '@/test-utils/mockFetch';

describe('broadcasts api', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('fetches broadcasts, templates and sends broadcast', async () => {
    (fetch as jest.Mock)
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
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({
          templates: { maintenance: 'm', tournament: 't' },
        }),
      });

    await expect(fetchBroadcasts()).resolves.toEqual({ broadcasts: [] });
    await expect(
      sendBroadcast({
        type: 'announcement',
        text: 'hi',
        urgent: false,
        sound: true,
      }),
    ).resolves.toEqual({
      id: '1',
      type: 'announcement',
      text: 'hi',
      urgent: false,
      timestamp: '2020-01-01T00:00:00.000Z',
    });
    await expect(fetchBroadcastTemplates()).resolves.toEqual({
      templates: { maintenance: 'm', tournament: 't' },
    });
  });

  it('throws ApiError on failure', async () => {
    mockFetchError();
    await expect(fetchBroadcasts()).rejects.toMatchObject({
      message: 'Failed to fetch broadcasts: Server Error',
    });
    await expect(
      sendBroadcast({
        type: 'announcement',
        text: 'x',
        urgent: false,
        sound: true,
      }),
    ).rejects.toMatchObject({
      message: expect.stringContaining('Server Error'),
    });
    await expect(fetchBroadcastTemplates()).rejects.toMatchObject({
      message: 'Failed to fetch broadcast templates: Server Error',
    });
  });
});
