'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faChartLine,
  faUsers,
  faTableCells,
  faTrophy,
  faGift,
  faBullhorn,
  faEnvelope,
  faChartBar,
  faDollarSign,
  faClipboardList,
} from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';

export type SidebarTab =
  | 'dashboard'
  | 'users'
  | 'balance'
  | 'audit'
  | 'tables'
  | 'tournaments'
  | 'bonus'
  | 'broadcast'
  | 'messages'
  | 'analytics';

const items: {
  id: SidebarTab;
  label: string;
  icon: IconDefinition;
  disabled?: boolean;
}[] = [
  { id: 'dashboard', label: 'Dashboard', icon: faChartLine },
  { id: 'users', label: 'Manage Users', icon: faUsers },
  { id: 'balance', label: 'Balance & Transactions', icon: faDollarSign },
  { id: 'tables', label: 'Manage Tables', icon: faTableCells },
  { id: 'tournaments', label: 'Tournaments', icon: faTrophy },
  { id: 'bonus', label: 'Bonus Manager', icon: faGift },
  { id: 'broadcast', label: 'Broadcast', icon: faBullhorn },
  { id: 'messages', label: 'Messages', icon: faEnvelope },
  { id: 'audit', label: 'Audit Logs', icon: faClipboardList },
  { id: 'analytics', label: 'Analytics', icon: faChartBar },
];

interface SidebarProps {
  active?: SidebarTab;
  onChange?: (tab: SidebarTab) => void;
  open?: boolean;
  setOpen?: (open: boolean) => void;
}

export default function Sidebar({
  active,
  onChange,
  open,
  setOpen,
}: SidebarProps) {
  const [internal, setInternal] = useState<SidebarTab>('dashboard');
  const current = active ?? internal;
  const [internalOpen, setInternalOpen] = useState(false);
  const sidebarOpen = open ?? internalOpen;
  const updateOpen = setOpen ?? setInternalOpen;

  const change = (id: SidebarTab, disabled?: boolean) => {
    if (disabled) return;
    if (onChange) onChange(id);
    else setInternal(id);
    updateOpen(false);
  };

  return (
    <>
      <aside
        className={`h-full w-64 bg-card-bg border-r border-dark p-4 fixed inset-y-0 left-0 z-40 transform transition-transform md:static md:translate-x-0 md:shrink-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <nav aria-label="Dashboard sidebar" className="space-y-2">
          {items.map((it) => {
            const isActive = current === it.id;
            const disabled = !!it.disabled;

            return (
              <button
                key={it.id}
                onClick={() => change(it.id, disabled)}
                disabled={disabled}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left transition
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-hover-bg'}
                ${isActive ? 'bg-accent-yellow text-black font-semibold' : 'text-text-secondary hover:text-text-primary'}
              `}
              >
                <span
                  className={`grid place-items-center h-8 w-8 rounded-lg border
                  ${isActive ? 'border-transparent bg-black/10' : 'border-dark'}
                `}
                >
                  <FontAwesomeIcon
                    icon={it.icon}
                    className={`${isActive ? 'text-black' : 'text-text-secondary'}`}
                  />
                </span>
                <span className="font-medium">{it.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => updateOpen(false)}
        />
      )}
    </>
  );
}
