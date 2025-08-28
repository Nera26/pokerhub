'use client';
import { useState } from 'react';

type Action = 'warn' | 'restrict' | 'ban';

interface Flag {
  id: string;
  player: string;
  history: string[];
  action: Action;
}

const next: Record<Action, Action> = {
  warn: 'restrict',
  restrict: 'ban',
  ban: 'ban',
};

export default function AntiCheatPage() {
  const [flags, setFlags] = useState<Flag[]>([
    {
      id: '1',
      player: 'PlayerOne',
      history: ['vpip correlation high'],
      action: 'warn',
    },
    {
      id: '2',
      player: 'PlayerTwo',
      history: ['timing similarity'],
      action: 'restrict',
    },
  ]);

  const escalate = (id: string) => {
    setFlags((fs) =>
      fs.map((f) =>
        f.id === id ? { ...f, action: next[f.action] } : f,
      ),
    );
  };

  return (
    <div>
      <h1>Anti-Cheat Review</h1>
      <ul>
        {flags.map((f) => (
          <li key={f.id} className="mb-4">
            <div>{f.player}</div>
            <ul>
              {f.history.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
            <button onClick={() => escalate(f.id)}>
              {f.action.charAt(0).toUpperCase() + f.action.slice(1)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
