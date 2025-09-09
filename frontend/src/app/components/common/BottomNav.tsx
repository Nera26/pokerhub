'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image from 'next/image';
import { faHome } from '@fortawesome/free-solid-svg-icons/faHome';
import { faWallet } from '@fortawesome/free-solid-svg-icons/faWallet';
import { faTags } from '@fortawesome/free-solid-svg-icons/faTags';
import { faTrophy } from '@fortawesome/free-solid-svg-icons/faTrophy';
import { faBell } from '@fortawesome/free-solid-svg-icons/faBell';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/hooks/notifications';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

export default function BottomNav() {
  const pathname = usePathname();
  const { avatarUrl } = useAuth();
  const {
    data: notifData,
    isLoading: notifLoading,
    error: notifError,
  } = useNotifications();

  const { data: flags } = useFeatureFlags();

  type NavItem = {
    href: string;
    label: string;
    icon?: IconDefinition;
    badge?: number;
    avatar?: string;
  };

  const items: (NavItem & { flag: string })[] = [
    { flag: 'lobby', href: '/', label: 'Lobby', icon: faHome },
    { flag: 'wallet', href: '/wallet', label: 'Wallet', icon: faWallet },
    {
      flag: 'promotions',
      href: '/promotions',
      label: 'Promotions',
      icon: faTags,
    },
    {
      flag: 'leaderboard',
      href: '/leaderboard',
      label: 'Leaders',
      icon: faTrophy,
    },
    {
      flag: 'notifications',
      href: '/notification',
      label: 'Alerts',
      icon: faBell,
      badge: !notifLoading && !notifError ? notifData?.unread : undefined,
    },
    {
      flag: 'profile',
      href: '/profile',
      label: 'Profile',
      avatar: avatarUrl || undefined,
    },
  ];

  const navItems: NavItem[] = items
    .filter(({ flag }) => flags?.[flag] !== false)
    .map(({ flag: _flag, ...item }) => item);

  return (
    <nav
      aria-label="Bottom navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 bg-card-bg border-t border-border-dark flex justify-around items-center h-[72px] pb-[env(safe-area-inset-bottom)] z-50"
    >
      {navItems.map((item) => {
        const active =
          item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            className={`relative flex flex-col items-center p-2 ${active ? 'text-accent-yellow' : 'text-text-secondary hover:text-accent-yellow'}`}
          >
            {item.badge && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger-red text-xs text-white">
                {item.badge}
              </span>
            )}
            {item.icon && (
              <FontAwesomeIcon icon={item.icon} className="text-xl mb-1" />
            )}
            {item.avatar && (
              <Image
                src={item.avatar}
                alt="User Avatar"
                width={24}
                height={24}
                sizes="24px"
                className="w-6 h-6 rounded-full mb-1 border border-accent-yellow"
              />
            )}
            <span className="text-xs">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
