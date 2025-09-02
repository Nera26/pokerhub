/* istanbul ignore file */
import { env } from './env';

export async function serverFetch(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  if (env.IS_E2E) {
    if (url.includes('/api/hands')) {
      return fetch(url, init);
    }
    if (url.includes('/api/leaderboard')) {
      return new Response(
        JSON.stringify([
          {
            playerId: 'neo',
            rank: 1,
            points: 100,
            rd: 40,
            volatility: 0.06,
            net: 50,
            bb100: 10,
            hours: 1,
            roi: 1,
            finishes: { 1: 1 },
          },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }
    if (url.includes('/api/wallet')) {
      return new Response(
        JSON.stringify({
          kycVerified: true,
          denialReason: null,
          realBalance: 123456,
          creditBalance: 0,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
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
        JSON.stringify({ notifications: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }
    return new Response('', { status: 200 });
  }
  return fetch(url, init);
}
