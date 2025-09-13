'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons/faBell';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { fetchNavItems } from '@/lib/api/nav';
import { useSettings } from '@/hooks/useSettings';

interface NavigationLinksProps {
  balance: string;
}

export default function NavigationLinks({ balance }: NavigationLinksProps) {
  const { avatarUrl } = useAuth();
  const { data: settings } = useSettings();
  const {
    data: items = [],
    isLoading,
    error,
  } = useQuery({ queryKey: ['nav-items'], queryFn: fetchNavItems });

  if (isLoading || error) return null;

  return (
    <>
      {items
        .filter((item) => item.flag !== 'notifications')
        .map((item) => {
          if (item.flag === 'profile') {
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className="flex items-center text-text-secondary hover:text-accent-yellow transition-colors duration-200"
              >
                <Image
                  src={
                    avatarUrl ||
                    settings?.defaultAvatar ||
                    'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
                  }
                  alt="User Avatar"
                  width={32}
                  height={32}
                  sizes="32px"
                  className="w-8 h-8 rounded-full mr-2 border-2 border-accent-yellow"
                />
                <span>{item.label}</span>
              </Link>
            );
          }
          if (item.flag === 'wallet') {
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className="text-text-secondary hover:text-accent-yellow transition-colors duration-200 flex items-center"
                aria-label={item.label}
              >
                {item.icon && (
                  <FontAwesomeIcon icon={item.icon} className="mr-2" />
                )}
                <span className="font-semibold">{balance}</span>
              </Link>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className="text-text-secondary hover:text-accent-yellow transition-colors duration-200 flex items-center"
            >
              {item.icon && (
                <FontAwesomeIcon icon={item.icon} className="mr-2" />
              )}
              <span>{item.label}</span>
            </Link>
          );
        })}
      <Link
        href="/notifications"
        prefetch
        className="text-text-secondary hover:text-accent-yellow transition-colors duration-200 flex items-center"
      >
        <FontAwesomeIcon icon={faBell} className="mr-2" />
        <span>Alerts</span>
      </Link>
    </>
  );
}
