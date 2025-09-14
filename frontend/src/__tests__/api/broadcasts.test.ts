/** @jest-environment node */

import {
  fetchBroadcasts,
  sendBroadcast,
  fetchBroadcastTemplates,
} from '@/lib/api/broadcasts';
import { server } from '@/test-utils/server';
import { mockSuccess, mockError } from '@/test-utils/handlers';

describe('broadcasts api', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('fetches broadcasts, templates and sends broadcast', async () => {
    server.use(
      mockSuccess({ broadcasts: [] }, { once: true }),
      mockSuccess(
        {
          id: '1',
          type: 'announcement',
          text: 'hi',
          urgent: false,
          timestamp: '2020-01-01T00:00:00.000Z',
        },
        { once: true },
      ),
      mockSuccess(
        { templates: { maintenance: 'm', tournament: 't' } },
        { once: true },
      ),
    );

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
    server.use(mockError());
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
