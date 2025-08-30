'use client';

import { useEffect, useState } from 'react';
import {
  listFlaggedSessions,
  applyAction,
  getActionHistory,
} from '@/lib/api/collusion';
import type {
  FlaggedSession,
  ReviewAction,
  ReviewActionLog,
} from '@shared/types';
import { useAuthToken } from '@/app/store/authStore';

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
  const [history, setHistory] = useState<Record<string, ReviewActionLog[]>>({});
  const token = useAuthToken();

  useEffect(() => {
    if (!token) return;
    listFlaggedSessions(token)
      .then(async (s) => {
        setSessions(s);
        const entries = await Promise.all(
          s.map((sess) => getActionHistory(sess.id, token)),
        );
        const map: Record<string, ReviewActionLog[]> = {};
        s.forEach((sess, i) => {
          map[sess.id] = entries[i];
        });
        setHistory(map);
      })
      .catch(() => {
        setSessions([]);
        setHistory({});
      });
  }, [token]);

  const act = async (id: string, status: FlaggedSession['status']) => {
    if (!token) return;
    const action = nextAction(status);
    if (!action) return;
    await applyAction(id, action, token);
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: action } : s)),
    );
    setHistory((prev) => ({
      ...prev,
      [id]: [
        ...(prev[id] ?? []),
        { action, timestamp: Date.now(), reviewerId: 'you' },
      ],
    }));
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
            <th className="p-2">History</th>
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
                <td className="p-2">
                  <ul>
                    {(history[s.id] ?? []).map((h, idx) => (
                      <li key={idx}>
                        {h.action} by {h.reviewerId}
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}
