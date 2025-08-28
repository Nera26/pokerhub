'use client';

import { useEffect, useState } from 'react';
import { listFlaggedSessions, applyAction } from '@/lib/api/collusion';
import type { FlaggedSession, ReviewAction } from '@shared/types';

function nextAction(status: FlaggedSession['status']): ReviewAction | null {
  switch (status) {
    case 'flagged':
      return 'warn';
    case 'warn':
      return 'restrict';
    case 'restrict':
      return 'ban';
    default:
      return null;
  }
}

export default function CollusionReviewPage() {
  const [sessions, setSessions] = useState<FlaggedSession[]>([]);

  useEffect(() => {
    listFlaggedSessions()
      .then(setSessions)
      .catch(() => setSessions([]));
  }, []);

  const act = async (id: string, status: FlaggedSession['status']) => {
    const action = nextAction(status);
    if (!action) return;
    await applyAction(id, action);
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: action } : s)),
    );
  };

  return (
    <main id="main-content" className="p-4">
      <h1 className="text-2xl font-bold mb-4">Flagged Sessions</h1>
      <table className="w-full text-left">
        <thead>
          <tr>
            <th className="p-2">ID</th>
            <th className="p-2">Users</th>
            <th className="p-2">Status</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => {
            const action = nextAction(s.status);
            return (
              <tr key={s.id} className="border-t border-dark">
                <td className="p-2">{s.id}</td>
                <td className="p-2">{s.users.join(', ')}</td>
                <td className="p-2">{s.status}</td>
                <td className="p-2">
                  {action && (
                    <button
                      className="px-2 py-1 bg-accent-yellow text-black rounded"
                      onClick={() => act(s.id, s.status)}
                    >
                      {action}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}
