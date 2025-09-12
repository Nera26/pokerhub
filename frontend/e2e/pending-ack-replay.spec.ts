import { test, expect } from '@playwright/test';
import { gameGatewaySetup } from './utils/gameGatewaySetup';
import { createGameNamespace } from '../src/lib/socket-namespaces';
import { GameActionSchema } from '@shared/schemas/game';
import { EVENT_SCHEMA_VERSION } from '@shared/events';

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

  const { getSocket, emitWithAck, disconnect } = createGameNamespace('game');

  const s = getSocket();
  await new Promise((res) => s.on('connect', res));

  const action = {
    type: 'bet',
    playerId: 'A',
    amount: 5,
    tableId: 'default',
  };
  const payload = { version: EVENT_SCHEMA_VERSION, ...action };
  GameActionSchema.parse(payload);

  const promise = emitWithAck('action', payload, 'action:ack');
  s.disconnect();
  s.connect();
  await promise;

  expect(pot).toBe(5);

  disconnect();
  await app.close();
});
