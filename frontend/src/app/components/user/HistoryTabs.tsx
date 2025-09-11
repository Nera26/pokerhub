// components/user/HistoryTabs.tsx
'use client';
import { useQuery } from '@tanstack/react-query';
import { fetchHistoryTabs, type HistoryTabItem } from '@/lib/api/historyTabs';

interface Props {
  selected: 'game-history' | 'tournament-history' | 'transaction-history';
  onChange(tab: string): void;
}

export default function HistoryTabs({ selected, onChange }: Props) {
  const {
    data: tabs,
    isLoading,
    error,
  } = useQuery<HistoryTabItem[]>({
    queryKey: ['history-tabs'],
    queryFn: ({ signal }) => fetchHistoryTabs({ signal }),
  });

  if (isLoading) {
    return (
      <div role="status" className="p-4 text-center text-text-secondary">
        Loading...
      </div>
    );
  }
  if (error) {
    return (
      <div role="alert" className="p-4 text-center text-danger-red">
        Failed to load history tabs.
      </div>
    );
  }
  if (!tabs || tabs.length === 0) {
    return (
      <div className="p-4 text-center text-text-secondary">
        No history available.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border-b border-border-dark mb-6">
      <ul className="flex space-x-8 whitespace-nowrap px-4 lg:px-0">
        {tabs.map((t) => (
          <li key={t.key}>
            <button
              onClick={() => onChange(t.key)}
              className={`
                pb-2 font-semibold cursor-pointer focus:outline-none
                ${
                  selected === t.key
                    ? 'border-b-2 border-accent-yellow text-accent-yellow'
                    : 'text-text-secondary hover:text-accent-yellow transition-colors duration-150'
                }
              `}
            >
              {t.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
