import { test, expect } from '@playwright/test';
import { gameGatewaySetup } from './utils/gameGatewaySetup';

async function waitFor(cond: () => boolean, timeout = 500) {
  const start = Date.now();
  while (!cond() && Date.now() - start < timeout) {
    await new Promise((r) => setTimeout(r, 10));
  }
}

test('deduplicates action and resumes tick after reconnect', async () => {
  const handLog: string[] = [];
  let pot = 0;
  let settled = false;
  const room = {
    apply: async (action: any) => {
      if (action.type === 'bet') pot += action.amount ?? 0;
      if (action.type === 'next' && !settled) {
        handLog.push('settle');
        settled = true;
      } else {
        handLog.push(action.type);
      }
      return { street: 'preflop', pot, players: [] };
    },
    getPublicState: async () => ({ street: 'preflop', pot, players: [] }),
    replay: async () => ({ street: 'preflop', pot, players: [] }),
  };

  const { app, connect } = await gameGatewaySetup({ room });

  const bet = {
    type: 'bet',
    playerId: 'A',
    amount: 5,
    tableId: 'default',
    version: '1',
  };
  const next = { type: 'next', tableId: 'default', version: '1' };

  const client1 = await connect();
  const states1: any[] = [];
  client1.on('state', (s) => states1.push(s));
  client1.emit('action', { ...bet, actionId: 'a1' });
  await waitFor(() => states1.length >= 1);
  client1.disconnect();

  const client2 = await connect();
  const states2: any[] = [];
  const acks: any[] = [];
  client2.on('state', (s) => states2.push(s));
  client2.on('action:ack', (a) => acks.push(a));
  client2.emit('action', { ...bet, actionId: 'a1' });
  client2.emit('action', { ...next, actionId: 'a2' });
  await waitFor(() => acks.length >= 2 && states2.length >= 1);
  client2.disconnect();

  expect(acks[0]).toEqual({ actionId: 'a1', duplicate: true });
  expect(states1[0].tick).toBe(1);
  expect(states2[0].tick).toBe(2);
  expect(states2[0].pot).toBe(5);
  expect(handLog).toEqual(['bet', 'settle']);

  await app.close();
});
