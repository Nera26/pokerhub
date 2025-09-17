'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from './notifications';
import { fetchNavItems, type NavItem } from '@/lib/api/nav';

export function useNavItems() {
  const { avatarUrl } = useAuth();
  const {
    data: notifData,
    isLoading: notifLoading,
    error: notifError,
  } = useNotifications();

  const {
    data: items = [],
    isLoading: navLoading,
    error: navError,
  } = useQuery({ queryKey: ['nav-items'], queryFn: fetchNavItems });

  const itemsWithDynamic = items.map((item) => {
    if (item.flag === 'notifications') {
      return {
        ...item,
        badge: !notifLoading && !notifError ? notifData?.unread : undefined,
      };
    }
    if (item.flag === 'profile') {
      return { ...item, avatar: avatarUrl || undefined };
    }
    return item;
  });

  return {
    items: itemsWithDynamic,
    loading: navLoading || notifLoading,
    error: navError ?? null,
  };
}

export type { NavItem };
