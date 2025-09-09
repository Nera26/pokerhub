'use client';

import { useState, useMemo } from 'react';
import Button from '../ui/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons/faCheck';
import useRenderCount from '@/hooks/useRenderCount';
import VirtualizedList from '@/components/VirtualizedList';
import NotificationItem from './NotificationItem';
import {
  useNotifications,
  useMarkAllRead,
  useMarkRead,
  useNotificationFilters,
} from '@/hooks/notifications';
import type { NotificationType } from '@shared/types';

export default function NotificationList() {
  useRenderCount('NotificationList');

  const {
    data: notificationsData,
    isLoading: listLoading,
    error: listError,
  } = useNotifications({ refetchInterval: 20000 });
  const notifications = notificationsData?.notifications ?? [];

  const {
    data: filterOptions,
    isLoading: filtersLoading,
    error: filtersError,
  } = useNotificationFilters();
  const filters = useMemo(
    () => [{ label: 'All', value: 'all' as const }, ...(filterOptions ?? [])],
    [filterOptions],
  );

  const [filter, setFilter] = useState<'all' | NotificationType>('all');

  const markAllRead = useMarkAllRead();
  const markRead = useMarkRead();

  const handleMarkAllRead = () => markAllRead.mutate();
  const handleItemClick = (id: string) => markRead.mutate(id);

  const filtered = useMemo(
    () =>
      notifications
        .filter((n) => (filter === 'all' ? true : n.type === filter))
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        ),
    [notifications, filter],
  );

  return (
    <div className="max-w-4xl mx-auto p-6 overflow-x-hidden">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <Button variant="ghost" onClick={handleMarkAllRead}>
          Mark All as Read
        </Button>
      </div>

      <div className="flex gap-4 mb-6 overflow-x-auto w-full">
        {filtersLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="px-4 py-2 rounded-xl bg-card-bg h-8 w-20 animate-pulse"
            />
          ))
        ) : filtersError ? (
          <p className="text-danger-red text-sm">Failed to load filters.</p>
        ) : (
          filters.map((f) => (
            <button
              key={f.value}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-opacity duration-200 hover:opacity-80 ${
                filter === f.value
                  ? 'bg-accent-yellow text-primary-bg'
                  : 'bg-card-bg text-text-secondary hover:bg-hover-bg hover:text-accent-yellow'
              }`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))
        )}
      </div>

      {listError && (
        <p className="mb-4 text-danger-red text-sm">
          Failed to load notifications.
        </p>
      )}

      <div>
        {filtered.length === 0 && !listLoading && (
          <p className="text-center text-text-secondary py-6">
            No notifications found.
          </p>
        )}

        {listLoading ? (
          <div className="p-2 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-24 bg-card-bg rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <VirtualizedList
            items={filtered}
            estimateSize={96}
            className="max-h-[600px] overflow-auto"
            renderItem={(n, style) => (
              <li key={n.id} style={style}>
                <NotificationItem notification={n} onClick={handleItemClick} />
              </li>
            )}
          />
        ) : null}
      </div>

      {/* Mobile floating button */}
      <button
        onClick={handleMarkAllRead}
        className="fixed right-6 bottom-[calc(env(safe-area-inset-bottom)+96px)] bg-accent-yellow text-primary-bg rounded-full w-12 h-12 flex items-center justify-center shadow-lg sm:hidden motion-safe:transition-transform duration-200 hover:scale-105"
        aria-label="Mark all read"
      >
        <FontAwesomeIcon icon={faCheck} />
      </button>
    </div>
  );
}
