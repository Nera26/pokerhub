import { test, expect } from '@playwright/test';
import { gameGatewaySetup } from './utils/gameGatewaySetup';

test('replays pending actions after reconnect', async () => {
  let pot = 0;
  const room = {
    apply: async (action: any) => {
      if (action.type === 'bet') pot += action.amount ?? 0;
      return { street: 'preflop', pot, players: [] };
    },
    getPublicState: async () => ({ street: 'preflop', pot, players: [] }),
    replay: async () => ({ street: 'preflop', pot, players: [] }),
  };

  const { app, url } = await gameGatewaySetup({ room });
  process.env.NEXT_PUBLIC_SOCKET_URL = url;

  const { getGameSocket, sendAction, disconnectGameSocket } = await import(
    '../src/lib/socket'
  );

  const s = getGameSocket();
  await new Promise((res) => s.on('connect', res));

  const action = {
    type: 'bet',
    playerId: 'A',
    amount: 5,
    tableId: 'default',
  };

  const promise = sendAction(action);
  s.disconnect();
  s.connect();
  await promise;

  expect(pot).toBe(5);

  disconnectGameSocket();
  await app.close();
});
