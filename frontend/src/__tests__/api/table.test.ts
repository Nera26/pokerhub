/** @jest-environment node */

import { fetchTable, fetchSidePanelTabs } from '@/lib/api/table';

const sampleTable = {
  smallBlind: 1,
  bigBlind: 2,
  pot: 0,
  communityCards: [],
  players: [
    {
      id: 1,
      username: 'Alice',
      avatar: '',
      chips: 100,
    },
  ],
  chatMessages: [
    {
      id: 1,
      username: 'Alice',
      avatar: '',
      text: 'hi',
      time: '2023-01-01T00:00:00Z',
    },
  ],
  stateAvailable: true,
};

describe('table api', () => {
  it('fetches table data', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => sampleTable,
    });

    await expect(fetchTable('1')).resolves.toEqual(sampleTable);
  });

  it('throws ApiError on failure', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: { get: () => 'application/json' },
      json: async () => ({ error: 'nope' }),
    });

    await expect(fetchTable('1')).rejects.toEqual({
      status: 404,
      message: 'Not Found',
      details: '{"error":"nope"}',
    });
  });

  it('fetches side panel tabs', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ['history', 'chat', 'notes'],
    });

    await expect(fetchSidePanelTabs('1')).resolves.toEqual([
      'history',
      'chat',
      'notes',
    ]);
  });
});
