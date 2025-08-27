'use client';

import { useEffect, useState } from 'react';

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((res) => res.json() as Promise<string[]>)
      .then((data) => setPlayers(data))
      .catch(() => setPlayers([]));
  }, []);

  return (
    <main id="main-content" className="p-4">
      <h1 className="text-2xl font-bold mb-4">Leaderboard</h1>
      <ol className="list-decimal pl-4">
        {players.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ol>
    </main>
  );
}
