'use client';

import { useState } from 'react';
import { TabId } from './types';

const tabs: { id: TabId; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'users', label: 'Manage Users' },
  { id: 'tables', label: 'Manage Tables' },
  { id: 'balance', label: 'Balance & Transactions' },
  { id: 'logs', label: 'Audit Logs' },
  { id: 'tournaments', label: 'Tournaments' },
  { id: 'bonus', label: 'Bonus Manager' },
  { id: 'broadcast', label: 'Broadcast' },
  { id: 'messages', label: 'Messages' },
  { id: 'analytics', label: 'Analytics' },
];

interface DashboardTabsProps {
  tab?: TabId;
  onChange?: (tab: TabId) => void;
}

export default function DashboardTabs({ tab, onChange }: DashboardTabsProps) {
  const [internal, setInternal] = useState<TabId>('dashboard');
  const current = tab ?? internal;
  const setTab = onChange ?? setInternal;

  return (
    <div className="border-b border-dark">
      <nav aria-label="Dashboard tabs" className="-mb-px flex flex-wrap gap-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`py-4 px-1 border-b-2 text-sm font-medium
              ${
                current === t.id
                  ? 'border-accent-yellow text-accent-yellow'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-hover-bg'
              }`}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
