'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useNotifications } from '@/hooks/notifications';
import { useWallet } from '@/features/wallet/useWallet';
import NavigationLinks from './NavigationLinks';
import NotificationDropdown from './NotificationDropdown';

export default function Header() {
  const { data: notifData } = useNotifications();
  const notifications = notifData?.notifications ?? [];
  const { data: wallet } = useWallet();
  const balance = wallet
    ? (wallet.realBalance / 100).toLocaleString('en-US', {
        style: 'currency',
        currency: wallet.currency,
      })
    : '$0.00';

  return (
    <header className="bg-card-bg sticky top-0 z-50 pt-[env(safe-area-inset-top)]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center md:justify-between h-20">
          {/* Brand */}
          <div className="flex items-center">
            <Link href="/" prefetch className="flex items-center">
              <Image
                className="h-10 w-auto"
                src="/pokerhub-logo.svg"
                alt="PokerHub logo"
                width={40}
                height={40}
                sizes="40px"
              />
            </Link>
            <Link
              href="/"
              prefetch
              className="ml-3 text-2xl font-bold text-accent-yellow"
            >
              PokerHub
            </Link>
          </div>

          {/* Desktop nav */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center space-x-6 relative"
          >
            <NavigationLinks balance={balance} />
            <NotificationDropdown notifications={notifications} />
          </nav>
        </div>
      </div>
    </header>
  );
}
