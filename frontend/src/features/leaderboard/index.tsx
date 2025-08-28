'use client';

import { useEffect, useState } from 'react';
import {
  LeaderboardResponseSchema,
  type LeaderboardEntry,
} from '@shared/types';

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((res) => res.json() as Promise<unknown>)
      .then((data) => setPlayers(LeaderboardResponseSchema.parse(data)))
      .catch(() => setPlayers([]));
  }, []);

  return (
    <main id="main-content" className="p-4">
      <h1 className="text-2xl font-bold mb-4">Leaderboard</h1>
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="text-left">Rank</th>
            <th className="text-left">Player</th>
            <th className="text-left">Net</th>
            <th className="text-left">BB/100</th>
            <th className="text-left">Hours</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.playerId}>
              <td>{p.rank}</td>
              <td>{p.playerId}</td>
              <td>{p.net.toFixed(2)}</td>
              <td>{p.bb100.toFixed(2)}</td>
              <td>{p.hours.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
