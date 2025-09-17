'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNavItems, type NavItem } from '@/hooks/useNavItems';

export type SidebarTab = NavItem['flag'];

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
  const { items, loading, error } = useNavItems();
  const hasError = Boolean(error);

  const change = (flag: SidebarTab, href?: string) => {
    if (href) {
      router.push(href);
      updateOpen(false);
      return;
    }
    if (onChange) onChange(flag);
    else setInternal(flag);
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
        {hasError && (
          <div role="alert" className="text-red-500 mb-2">
            Failed to load sidebar
          </div>
        )}
        <nav aria-label="Dashboard sidebar" className="space-y-2">
          {items.map((it) => {
            const isActive = current === it.flag;
            return (
              <button
                key={it.flag}
                onClick={() => change(it.flag, it.href)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left transition
                hover:bg-hover-bg
                ${isActive ? 'bg-accent-yellow text-black font-semibold' : 'text-text-secondary hover:text-text-primary'}
              `}
              >
                <span
                  className={`grid place-items-center h-8 w-8 rounded-lg border
                  ${isActive ? 'border-transparent bg-black/10' : 'border-dark'}
                `}
                >
                  {it.avatar ? (
                    <Image
                      src={it.avatar}
                      alt={`${it.label} avatar`}
                      width={32}
                      height={32}
                      sizes="32px"
                      className="h-8 w-8 rounded-lg object-cover"
                    />
                  ) : (
                    it.icon && (
                      <FontAwesomeIcon
                        icon={it.icon}
                        className={`${isActive ? 'text-black' : 'text-text-secondary'}`}
                      />
                    )
                  )}
                </span>
                <span className="font-medium flex-1 text-left">{it.label}</span>
                {typeof it.badge === 'number' && it.badge > 0 && (
                  <span className="ml-auto flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-danger-red px-1 text-xs font-semibold text-white">
                    {it.badge}
                  </span>
                )}
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
