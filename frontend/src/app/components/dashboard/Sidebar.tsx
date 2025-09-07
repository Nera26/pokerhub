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
  faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchSidebarItems } from '@/lib/api/admin';
import type { SidebarItem } from '@shared/types';

export type SidebarTab = SidebarItem['id'];

interface SidebarItemWithIcon extends Omit<SidebarItem, 'icon'> {
  icon: IconDefinition;
}

const ICON_MAP: Record<string, IconDefinition> = {
  'chart-line': faChartLine,
  users: faUsers,
  'dollar-sign': faDollarSign,
  'table-cells': faTableCells,
  trophy: faTrophy,
  gift: faGift,
  bullhorn: faBullhorn,
  envelope: faEnvelope,
  'clipboard-list': faClipboardList,
  'chart-bar': faChartBar,
  'magnifying-glass': faMagnifyingGlass,
};


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
  const router = useRouter();
  const [items, setItems] = useState<SidebarItemWithIcon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchSidebarItems()
      .then((data) =>
        setItems(
          data.map((it) => ({
            ...it,
            icon: ICON_MAP[it.icon] ?? faChartLine,
          })),
        ),
      )
      .catch(() => {
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const change = (id: SidebarTab, disabled?: boolean, path?: string) => {
    if (disabled) return;
    if (path) {
      router.push(path);
      updateOpen(false);
      return;
    }
    if (onChange) onChange(id);
    else setInternal(id);
    updateOpen(false);
  };
  if (loading) {
    return <div>Loading sidebar...</div>;
  }

  return (
    <>
      <aside
        className={`h-full w-64 bg-card-bg border-r border-dark p-4 fixed inset-y-0 left-0 z-40 transform transition-transform md:static md:translate-x-0 md:shrink-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {error && (
          <div role="alert" className="text-red-500 mb-2">
            Failed to load sidebar
          </div>
        )}
        <nav aria-label="Dashboard sidebar" className="space-y-2">
          {items.map((it) => {
            const isActive = current === it.id;
            const disabled = !!it.disabled;

            return (
              <button
                key={it.id}
                onClick={() => change(it.id, disabled, it.path)}
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
