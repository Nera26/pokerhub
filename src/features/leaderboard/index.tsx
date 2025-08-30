'use client';

import { useLeaderboard } from './useLeaderboard';

export default function LeaderboardPage() {
  const { data, isLoading, error } = useLeaderboard();
  const players = data ?? [];

  return (
    <main id="main-content" className="p-4">
      <h1 className="text-2xl font-bold mb-4">Leaderboard</h1>
      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>Failed to load leaderboard</p>
      ) : (
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
      )}
    </main>
  );
}
