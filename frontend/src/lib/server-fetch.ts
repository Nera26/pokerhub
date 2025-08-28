/* istanbul ignore file */
import { env } from './env';

export async function serverFetch(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  if (env.IS_E2E) {
    if (url.includes('/api/leaderboard')) {
      return new Response(
        JSON.stringify({ players: [{ id: 1, name: 'Neo', chips: 42000 }] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }
    if (url.includes('/api/wallet')) {
      return new Response(JSON.stringify({ balance: 123456 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (url.includes('/api/tables')) {
      return new Response(
        JSON.stringify([
          {
            id: '1',
            tableName: 'E2E Table',
            stakes: { small: 1, big: 2 },
            players: { current: 1, max: 6 },
            buyIn: { min: 40, max: 200 },
            stats: { handsPerHour: 10, avgPot: 5, rake: 1 },
            createdAgo: '1m',
          },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }
    if (url.includes('/api/tournaments')) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (url.includes('/api/notifications')) {
      return new Response(
        JSON.stringify({
          notifications: [],
          balance: 0,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }
    return new Response('', { status: 200 });
  }
  return fetch(url, init);
}
