'use client';
import { useQuery } from '@tanstack/react-query';
import { fetchFlags, updateFlag, type Flag } from '@/lib/api/antiCheat';

const next: Record<Flag['action'], Flag['action']> = {
  warn: 'restrict',
  restrict: 'ban',
  ban: 'ban',
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

  const escalate = async (id: string, action: Flag['action']) => {
    await updateFlag(id, next[action]);
    await refetch();
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading flags</div>;
  if (!flags.length) return <div>No flags</div>;

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
            <button onClick={() => escalate(f.id, f.action)}>
              {f.action.charAt(0).toUpperCase() + f.action.slice(1)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
