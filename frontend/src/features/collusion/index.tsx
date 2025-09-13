'use client';

import {
  useFlaggedSessions,
  useActionHistory,
  useApplyCollusionAction,
} from '@/hooks/collusion';
import type { FlaggedSession, ReviewAction } from '@shared/types';
import { useAuthToken, usePlayerId } from '@/app/store/authStore';

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
  const token = useAuthToken();
  const reviewerId = usePlayerId();
  const { data: sessions = [], isLoading, isError } = useFlaggedSessions(token);
  const history = useActionHistory(sessions, token);
  const act = useApplyCollusionAction(token, reviewerId);

  if (isLoading) {
    return (
      <main id="main-content" className="p-4">
        Loading...
      </main>
    );
  }

  if (isError) {
    return (
      <main id="main-content" className="p-4">
        Failed to load sessions
      </main>
    );
  }

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
                      onClick={() => act.mutate({ id: s.id, status: s.status })}
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
