'use client';

import type { LeaderboardEntry } from '@shared/types';

interface LeaderboardTableProps {
  data: LeaderboardEntry[];
  onPlayerClick?: (player: LeaderboardEntry) => void;
}

export default function LeaderboardTable({
  data,
  onPlayerClick,
}: LeaderboardTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center text-text-secondary py-6">No results</div>
    );
  }

  return (
    <table className="min-w-full divide-y divide-border-dark">
      <thead className="bg-hover-bg">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-accent-yellow uppercase tracking-wider">
            Rank
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-accent-yellow uppercase tracking-wider">
            Player
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-accent-yellow uppercase tracking-wider">
            Net
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-accent-yellow uppercase tracking-wider">
            BB/100
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-accent-yellow uppercase tracking-wider">
            Hours
          </th>
        </tr>
      </thead>
      <tbody>
        {data.map((p) => (
          <tr
            key={p.playerId}
            className="border-b border-border-dark hover:bg-hover-bg cursor-pointer"
            onClick={() => onPlayerClick?.(p)}
          >
            <td className="px-6 py-4 whitespace-nowrap text-lg font-semibold text-accent-yellow">
              {p.rank}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">{p.playerId}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-accent-green">
              {p.net}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
              {p.bb100}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
              {p.hours}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
