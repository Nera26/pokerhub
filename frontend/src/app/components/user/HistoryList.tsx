// components/user/HistoryList.tsx
'use client';
import { memo } from 'react';
import Link from 'next/link';
import Tooltip from '../ui/Tooltip';

interface Entry {
  id: string;
  type: string;
  stakes: string;
  buyin: string;
  date: string;
  profit: boolean;
  amount: string;
}

interface Props {
  type: 'game-history' | 'tournament-history' | 'transaction-history';
  filters?: {
    gameType: string;
    profitLoss: string;
    date: string;
  };
  onWatchReplay?(): void;
  onViewBracket?(title: string): void;
}

function HistoryList({ type, filters, onWatchReplay, onViewBracket }: Props) {
  const gameData: Entry[] = [
    {
      id: '12463',
      type: "Texas Hold'em",
      stakes: '$2/$5',
      buyin: '$500',
      date: '2023-05-15',
      profit: true,
      amount: '+$234.50',
    },
    {
      id: '12445',
      type: 'Omaha Hi/Lo',
      stakes: '$5/$10',
      buyin: '$1000',
      date: '2023-05-14',
      profit: false,
      amount: '-$156.75',
    },
  ];

  // --- GAME HISTORY ---
  if (type === 'game-history') {
    return (
      <div className="bg-card-bg rounded-2xl p-8 space-y-4">
        {gameData
          .filter((e) => {
            if (!filters) return true;
            if (filters.gameType !== 'any' && e.type !== filters.gameType)
              return false;
            if (filters.profitLoss === 'win' && !e.profit) return false;
            if (filters.profitLoss === 'loss' && e.profit) return false;
            if (filters.date && e.date !== filters.date) return false;
            return true;
          })
          .map((e) => (
            <div
              key={e.id}
              className="border-b border-border-dark pb-4 flex justify-between"
            >
              <div>
                <p className="font-medium">
                  {e.type} – Table #{e.id}
                </p>
                <p className="text-text-secondary text-sm">
                  Stakes: {e.stakes} – Buy-in: {e.buyin}
                </p>
                <p className="text-text-secondary text-xs mt-1">{e.date}</p>
              </div>
              <div className="text-right">
                <p
                  className={`font-semibold ${e.profit ? 'text-accent-green' : 'text-danger-red'}`}
                >
                  {e.amount}
                </p>
                <button
                  onClick={onWatchReplay}
                  className="text-accent-yellow text-sm mt-2 hover:text-accent-blue cursor-pointer"
                >
                  Watch Replay
                </button>
                <Link
                  href={`/hands/${e.id}/proof`}
                  className="text-accent-yellow text-sm mt-2 hover:text-accent-blue cursor-pointer block"
                >
                  View Proof
                </Link>
              </div>
            </div>
          ))}
      </div>
    );
  }

  // --- TOURNAMENT HISTORY ---
  if (type === 'tournament-history') {
    const tournaments = [
      {
        name: 'Sunday Million',
        place: '5th',
        buyin: '$215',
        prize: '$1,234',
        duration: '4h 12m',
      },
      {
        name: 'High Roller',
        place: '2nd',
        buyin: '$1,050',
        prize: '$25,000',
        duration: '3h 45m',
      },
    ];

    return (
      <div className="bg-card-bg rounded-2xl p-8">
        <h3 className="text-lg font-semibold mb-4">Tournament History</h3>
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-border-dark">
          <table className="min-w-[640px] w-full text-left table-auto">
            <thead>
              <tr>
                {[
                  'Name',
                  'Place',
                  'Buy-in',
                  'Prize',
                  'Duration',
                  'Details',
                ].map((h) => (
                  <th key={h} className="pb-2 pr-6 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tournaments.map((row) => (
                <tr key={row.name} className="border-b border-border-dark">
                  <td className="py-2 pr-6 whitespace-nowrap">{row.name}</td>
                  <td className="py-2 pr-6 whitespace-nowrap">{row.place}</td>
                  <td className="py-2 pr-6 whitespace-nowrap">{row.buyin}</td>
                  <td className="py-2 pr-6 whitespace-nowrap">{row.prize}</td>
                  <td className="py-2 pr-6 whitespace-nowrap">
                    {row.duration}
                  </td>
                  <td className="py-2 pr-6 whitespace-nowrap">
                    <button
                      onClick={() => onViewBracket?.(row.name)}
                      className="text-accent-yellow hover:text-accent-blue text-sm cursor-pointer"
                    >
                      View Bracket
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // --- TRANSACTION HISTORY ---
  if (type === 'transaction-history') {
    const txns = [
      {
        date: 'May 16, 2023',
        type: 'Deposit',
        amount: '+$500.00',
        status: 'Completed',
        color: 'green',
      },
      {
        date: 'May 14, 2023',
        type: 'Cashout',
        amount: '-$200.00',
        status: 'Failed',
        color: 'red',
        tooltip: 'Insufficient funds',
      },
      {
        date: 'May 10, 2023',
        type: 'Bonus',
        amount: '+$50.00',
        status: 'Completed',
        color: 'green',
      },
    ];

    return (
      <div className="bg-card-bg rounded-2xl p-8">
        <h3 className="text-lg font-semibold mb-4">Wallet Activity</h3>
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-border-dark">
          <table className="min-w-[640px] w-full text-left table-auto">
            <thead>
              <tr>
                {['Date', 'Type', 'Amount', 'Status'].map((h) => (
                  <th key={h} className="pb-2 pr-6 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {txns.map((row) => (
                <tr key={row.date} className="border-b border-border-dark">
                  <td className="py-2 pr-6 whitespace-nowrap">{row.date}</td>
                  <td className="py-2 pr-6 whitespace-nowrap">{row.type}</td>
                  <td
                    className={`py-2 pr-6 whitespace-nowrap ${row.color === 'green' ? 'text-accent-green' : 'text-danger-red'}`}
                  >
                    {row.amount}
                  </td>
                  <td className="py-2 pr-6 whitespace-nowrap">
                    {row.tooltip ? (
                      <Tooltip text={row.tooltip}>
                        <span
                          className={`cursor-pointer ${row.color === 'green' ? 'text-accent-green' : 'text-danger-red'}`}
                        >
                          {row.status}
                        </span>
                      </Tooltip>
                    ) : (
                      <span
                        className={
                          row.color === 'green'
                            ? 'text-accent-green'
                            : 'text-danger-red'
                        }
                      >
                        {row.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
}

export default memo(HistoryList);
