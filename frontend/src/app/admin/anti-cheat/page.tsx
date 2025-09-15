'use client';
import { useQuery } from '@tanstack/react-query';
import {
  fetchFlags,
  updateFlag,
  fetchNextAction,
  type Flag,
} from '@/lib/api/antiCheat';
import { useState } from 'react';

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

  const escalate = async (id: string, action: Flag['action']) => {
    setLoadingId(id);
    setError(null);
    try {
      const next = await fetchNextAction(action);
      await updateFlag(id, next);
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
            <div>{f.player}</div>
            <ul>
              {f.history.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
            <button
              onClick={() => escalate(f.id, f.action)}
              disabled={loadingId === f.id}
            >
              {f.action.charAt(0).toUpperCase() + f.action.slice(1)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
