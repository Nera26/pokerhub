'use client';
import { useQuery } from '@tanstack/react-query';
import {
  fetchFlags,
  updateFlag,
  fetchNextAction,
  type Flag,
} from '@/lib/api/antiCheat';
import { useState } from 'react';

const getNextActionLabel = (status: Flag['status']) => {
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
};

export default function AntiCheatPage() {
  const {
    data: flags = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<Flag[], Error>({
    queryKey: ['anti-cheat', 'flags'],
    queryFn: fetchFlags,
  });

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const escalate = async (flag: Flag) => {
    setLoadingId(flag.id);
    setError(null);
    try {
      const next = await fetchNextAction(flag.status);
      if (!next) {
        setError('No further actions available');
        return;
      }
      await updateFlag(flag.id, next);
      await refetch();
    } catch {
      setError('Failed to escalate');
    } finally {
      setLoadingId(null);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading flags</div>;
  if (!flags.length) return <div>No flags</div>;

  return (
    <div>
      <h1>Anti-Cheat Review</h1>
      {error && <div role="alert">{error}</div>}
      <ul>
        {flags.map((f) => (
          <li key={f.id} className="mb-4">
            <div>{f.users.join(', ')}</div>
            <ul>
              {f.history.length === 0 ? (
                <li>No actions taken</li>
              ) : (
                f.history.map((entry) => (
                  <li
                    key={`${entry.timestamp}-${entry.reviewerId}-${entry.action}`}
                  >
                    {`${entry.action.toUpperCase()} by ${entry.reviewerId} at ${new Date(entry.timestamp).toISOString()}`}
                  </li>
                ))
              )}
            </ul>
            <div className="mt-2 text-sm text-gray-500">
              Current status: {f.status.toUpperCase()}
            </div>
            {(() => {
              const next = getNextActionLabel(f.status);
              return (
                <button
                  onClick={() => escalate(f)}
                  disabled={loadingId === f.id || !next}
                >
                  {next
                    ? next.charAt(0).toUpperCase() + next.slice(1)
                    : 'No further actions'}
                </button>
              );
            })()}
          </li>
        ))}
      </ul>
    </div>
  );
}
