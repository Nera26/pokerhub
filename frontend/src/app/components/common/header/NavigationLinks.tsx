'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavItems } from '@/hooks/useNavItems';
import { useSettings } from '@/hooks/useSettings';

interface NavigationLinksProps {
  balance: string;
}

export default function NavigationLinks({ balance }: NavigationLinksProps) {
  const { items, loading } = useNavItems();
  const { data: settings } = useSettings();

  if (loading) return null;

  const notifItem = items.find((item) => item.flag === 'notifications');

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
                    item.avatar ||
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
      {notifItem && (
        <Link
          href={notifItem.href}
          prefetch
          className="text-text-secondary hover:text-accent-yellow transition-colors duration-200 flex items-center relative"
        >
          {notifItem.badge && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger-red text-xs text-white">
              {notifItem.badge}
            </span>
          )}
          {notifItem.icon && (
            <FontAwesomeIcon icon={notifItem.icon} className="mr-2" />
          )}
          <span>{notifItem.label}</span>
        </Link>
      )}
    </>
  );
}
