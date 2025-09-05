'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faDollarSign,
  faTableCells,
  faTrophy,
  faArrowDown,
  faArrowUp,
} from '@fortawesome/free-solid-svg-icons';
import dynamic from 'next/dynamic';

const ActivityChart = dynamic(() => import('./charts/ActivityChart'), {
  loading: () => (
    <div className="h-64 flex items-center justify-center text-text-secondary">
      Loading chart...
    </div>
  ),
  ssr: false,
});

const RevenueDonut = dynamic(() => import('./charts/RevenueDonut'), {
  loading: () => (
    <div className="h-64 flex items-center justify-center text-text-secondary">
      Loading chart...
    </div>
  ),
  ssr: false,
});

type TimeFilter = 'today' | 'week' | 'month' | 'all';

// ---------- Small UI helpers ----------
function Card({
  title,
  children,
  className = '',
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-card-bg p-6 rounded-2xl card-shadow ${className}`}>
      {title ? <h3 className="text-lg font-bold mb-4">{title}</h3> : null}
      {children}
    </div>
  );
}

function PillBtn({
  children,
  color,
  onClick,
}: {
  children: React.ReactNode;
  color: 'blue' | 'red' | 'green' | 'yellow';
  onClick?: () => void;
}) {
  const map = {
    blue: 'bg-info hover:brightness-110 text-white',
    red: 'bg-danger hover:brightness-110 text-white',
    green: 'bg-success hover:brightness-110 text-white',
    yellow: 'bg-accent hover:brightness-110 text-black',
  } as const;
  return (
    <button
      onClick={onClick}
      className={`${map[color]} px-3 py-1 rounded text-xs font-semibold`}
    >
      {children}
    </button>
  );
}

// ---------- Content-only Dashboard ----------
export default function Dashboard() {
  const [revFilter, setRevFilter] = useState<TimeFilter>('today');
  const [depFilter, setDepFilter] = useState<TimeFilter>('today');
  const [wdFilter, setWdFilter] = useState<TimeFilter>('today');

  const revMap = {
    today: { amount: '$8,947', trend: '+8% vs yesterday' },
    week: { amount: '$34,112', trend: '+15% vs last week' },
    month: { amount: '$118,305', trend: '+12% vs last month' },
    all: { amount: '$358,200', trend: 'Total revenue' },
  };
  const depMap = {
    today: { amount: '$2,180', trend: '+15% vs yesterday' },
    week: { amount: '$21,380', trend: '+9% vs last week' },
    month: { amount: '$89,420', trend: '+12% vs last month' },
    all: { amount: '$445,280', trend: 'Total deposits' },
  };
  const wdMap = {
    today: { amount: '$1,640', trend: '+8% vs yesterday' },
    week: { amount: '$15,640', trend: '+5% vs last week' },
    month: { amount: '$67,890', trend: '+7% vs last month' },
    all: { amount: '$334,120', trend: 'Total withdrawals' },
  };

  const activityDataByFilter = {
    today: [45, 23, 67, 89, 156, 234, 189],
    week: [320, 280, 410, 520, 680, 890, 750],
    month: [1200, 980, 1450, 1780, 2100, 2650, 2300],
    all: [4500, 3800, 5200, 6100, 7200, 8900, 8100],
  };

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Active Users</p>
              <p className="text-2xl font-bold text-accent-green">247</p>
              <p className="text-xs text-accent-green">+12% today</p>
            </div>
            <FontAwesomeIcon
              icon={faUsers}
              className="text-3xl text-accent-green"
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-text-secondary text-sm">Revenue</p>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-2xl font-bold text-accent-yellow">
                  {revMap[revFilter].amount}
                </p>
                <select
                  value={revFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setRevFilter(e.target.value as TimeFilter)
                  }
                  className="bg-primary-bg text-xs px-2 py-1 rounded border border-dark text-accent-yellow cursor-pointer"
                >
                  <option value="today">Today</option>
                  <option value="week">7 Days</option>
                  <option value="month">Month</option>
                  <option value="all">All-Time</option>
                </select>
              </div>
              <p className="text-xs text-accent-yellow">
                {revMap[revFilter].trend}
              </p>
            </div>
            <FontAwesomeIcon
              icon={faDollarSign}
              className="text-3xl text-accent-yellow"
            />
          </div>
        </Card>

        <Card className="cursor-pointer hover:bg-hover-bg transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Open Tables</p>
              <p className="text-2xl font-bold text-accent-blue">18</p>
              <p className="text-xs text-text-secondary">6 full</p>
            </div>
            <FontAwesomeIcon
              icon={faTableCells}
              className="text-3xl text-accent-blue"
            />
          </div>
        </Card>

        <Card className="cursor-pointer hover:bg-hover-bg transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Tournaments</p>
              <p className="text-2xl font-bold">5</p>
              <p className="text-xs text-text-secondary">3 running</p>
            </div>
            <FontAwesomeIcon
              icon={faTrophy}
              className="text-3xl text-accent-yellow"
            />
          </div>
        </Card>

        <Card className="cursor-pointer hover:bg-hover-bg transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-text-secondary text-sm">Deposits</p>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-2xl font-bold text-accent-green">
                  {depMap[depFilter].amount}
                </p>
                <select
                  value={depFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setDepFilter(e.target.value as TimeFilter)
                  }
                  className="bg-primary-bg text-xs px-2 py-1 rounded border border-dark text-accent-green cursor-pointer"
                >
                  <option value="today">Today</option>
                  <option value="week">7 Days</option>
                  <option value="month">Month</option>
                  <option value="all">All-Time</option>
                </select>
              </div>
              <p className="text-xs text-accent-green">
                {depMap[depFilter].trend}
              </p>
            </div>
            <FontAwesomeIcon
              icon={faArrowDown}
              className="text-3xl text-accent-green"
            />
          </div>
        </Card>

        <Card className="cursor-pointer hover:bg-hover-bg transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-text-secondary text-sm">Withdrawals</p>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-2xl font-bold text-danger-red">
                  {wdMap[wdFilter].amount}
                </p>
                <select
                  value={wdFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setWdFilter(e.target.value as TimeFilter)
                  }
                  className="bg-primary-bg text-xs px-2 py-1 rounded border border-dark text-danger-red cursor-pointer"
                >
                  <option value="today">Today</option>
                  <option value="week">7 Days</option>
                  <option value="month">Month</option>
                  <option value="all">All-Time</option>
                </select>
              </div>
              <p className="text-xs text-danger-red">{wdMap[wdFilter].trend}</p>
            </div>
            <FontAwesomeIcon
              icon={faArrowUp}
              className="text-3xl text-danger-red"
            />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Player Activity (24h)">
          <ActivityChart data={activityDataByFilter[revFilter]} />
        </Card>
        <Card title="Revenue Breakdown">
          <RevenueDonut
            filter={revFilter}
            onTooltipValues={(index, filter) => {
              const values: Record<TimeFilter, [number, number, number]> = {
                today: [5820, 2238, 889],
                week: [22340, 8560, 3212],
                month: [76890, 29340, 12075],
                all: [234560, 89430, 34210],
              };
              return values[filter][index];
            }}
          />
        </Card>
      </div>

      {/* Lower panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Management */}
        <Card title="User Management">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-primary-bg rounded-xl">
              <div className="flex items-center gap-3">
                <Image
                  src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg"
                  alt="Mike"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <p className="text-sm font-semibold">Mike_P</p>
                  <p className="text-sm font-bold">$2,847</p>
                </div>
              </div>
              <div className="flex gap-2">
                <PillBtn color="blue">Edit</PillBtn>
                <PillBtn color="red">Ban</PillBtn>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-primary-bg rounded-xl">
              <div className="flex items-center gap-3">
                <Image
                  src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg"
                  alt="Sarah"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <p className="text-sm font-semibold">Sarah_K</p>
                  <p className="text-sm font-bold">$1,420</p>
                </div>
              </div>
              <div className="flex gap-2">
                <PillBtn color="blue">Edit</PillBtn>
                <PillBtn color="red">Ban</PillBtn>
              </div>
            </div>
          </div>
          <button className="w-full mt-4 bg-accent-green hover:brightness-110 py-2 rounded-xl font-semibold">
            View All Users
          </button>
        </Card>

        {/* Active Tables */}
        <Card title="Active Tables">
          <div className="space-y-3">
            <div className="p-3 bg-primary-bg rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Table #45821</span>
                <span className="text-accent-green text-sm font-bold">9/9</span>
              </div>
              <p className="text-sm text-text-secondary mb-2">
                NL Hold'em • $1/$2
              </p>
              <div className="flex gap-2">
                <PillBtn color="blue">Config</PillBtn>
                <PillBtn color="red">Close</PillBtn>
              </div>
            </div>
            <div className="p-3 bg-primary-bg rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Table #45822</span>
                <span className="text-accent-yellow text-sm font-bold">
                  6/9
                </span>
              </div>
              <p className="text-sm text-text-secondary mb-2">
                NL Hold'em • $2/$5
              </p>
              <div className="flex gap-2">
                <PillBtn color="blue">Config</PillBtn>
                <PillBtn color="red">Close</PillBtn>
              </div>
            </div>
          </div>
          <button className="w-full mt-4 bg-accent-green hover:brightness-110 py-2 rounded-xl font-semibold">
            Create New Table
          </button>
        </Card>

        {/* Messages & Broadcast */}
        <Card title="Messages &amp; Broadcast">
          <div className="space-y-3">
            <div className="p-3 bg-primary-bg rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-accent-yellow rounded-full" />
                <span className="text-sm font-semibold">Mike_P</span>
              </div>
              <p className="text-xs text-text-secondary">
                Need help with withdrawal...
              </p>
              <button className="text-accent-blue text-xs mt-1">Reply</button>
            </div>
            <div className="p-3 bg-primary-bg rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-accent-green rounded-full" />
                <span className="text-sm font-semibold">Sarah_K</span>
              </div>
              <p className="text-xs text-text-secondary">
                Tournament question...
              </p>
              <button className="text-accent-blue text-xs mt-1">Reply</button>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <input
              type="text"
              placeholder="Broadcast message..."
              className="w-full bg-primary-bg border border-dark rounded-xl px-3 py-2 text-sm"
            />
            <button className="w-full bg-accent-yellow hover:brightness-110 text-black py-2 rounded-xl font-semibold">
              Send Broadcast
            </button>
          </div>
        </Card>
      </div>

      {/* Transaction Log */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Deposit &amp; Withdrawal Log</h3>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="rounded" />
            <span className="text-text-secondary">Only show pending</span>
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark">
                <th className="text-left py-3 px-2 text-text-secondary">
                  User
                </th>
                <th className="text-left py-3 px-2 text-text-secondary">
                  Type
                </th>
                <th className="text-left py-3 px-2 text-text-secondary">
                  Amount
                </th>
                <th className="text-left py-3 px-2 text-text-secondary">
                  Method
                </th>
                <th className="text-left py-3 px-2 text-text-secondary">
                  Date
                </th>
                <th className="text-left py-3 px-2 text-text-secondary">
                  Status
                </th>
                <th className="text-left py-3 px-2 text-text-secondary">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-dark hover:bg-hover-bg">
                <td className="py-3 px-2">Mike_P</td>
                <td className="py-3 px-2">
                  <span className="text-accent-green">Deposit</span>
                </td>
                <td className="py-3 px-2 font-semibold">$500</td>
                <td className="py-3 px-2">QPay</td>
                <td className="py-3 px-2 text-text-secondary">2024-01-15</td>
                <td className="py-3 px-2">
                  <span className="bg-accent-green/20 text-accent-green px-2 py-1 rounded-lg text-xs">
                    Completed
                  </span>
                </td>
                <td className="py-3 px-2">-</td>
              </tr>
              <tr className="border-b border-dark hover:bg-hover-bg">
                <td className="py-3 px-2">Sarah_K</td>
                <td className="py-3 px-2">
                  <span className="text-danger-red">Withdraw</span>
                </td>
                <td className="py-3 px-2 font-semibold">$200</td>
                <td className="py-3 px-2">Crypto</td>
                <td className="py-3 px-2 text-text-secondary">2024-01-15</td>
                <td className="py-3 px-2">
                  <span className="bg-accent-yellow/20 text-accent-yellow px-2 py-1 rounded-lg text-xs">
                    Pending
                  </span>
                </td>
                <td className="py-3 px-2">
                  <div className="flex gap-1">
                    <PillBtn color="green">Approve</PillBtn>
                    <PillBtn color="red">Reject</PillBtn>
                  </div>
                </td>
              </tr>
              <tr className="border-b border-dark hover:bg-hover-bg">
                <td className="py-3 px-2">Alex_R</td>
                <td className="py-3 px-2">
                  <span className="text-danger-red">Withdraw</span>
                </td>
                <td className="py-3 px-2 font-semibold">$750</td>
                <td className="py-3 px-2">Card</td>
                <td className="py-3 px-2 text-text-secondary">2024-01-14</td>
                <td className="py-3 px-2">
                  <span className="bg-danger-red/20 text-danger-red px-2 py-1 rounded-lg text-xs">
                    Failed
                  </span>
                </td>
                <td className="py-3 px-2">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
