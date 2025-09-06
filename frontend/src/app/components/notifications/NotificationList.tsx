'use client';

import { useState, useRef, useMemo } from 'react';
import Button from '../ui/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons/faCheck';
import useRenderCount from '@/hooks/useRenderCount';
import { useVirtualizer } from '@tanstack/react-virtual';
import NotificationItem from './NotificationItem';
import {
  useNotifications,
  useMarkAllRead,
  useMarkRead,
  type NotificationType,
} from '@/hooks/notifications';

const filters: { label: string; value: NotificationType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Bonuses', value: 'bonus' },
  { label: 'System', value: 'system' },
];

export default function NotificationList() {
  useRenderCount('NotificationList');

  const {
    data: notificationsData,
    isLoading: listLoading,
    error: listError,
  } = useNotifications({ refetchInterval: 20000 });
  const notifications = notificationsData?.notifications ?? [];

  const [filter, setFilter] = useState<'all' | NotificationType>('all');

  const markAllRead = useMarkAllRead();
  const markRead = useMarkRead();

  const handleMarkAllRead = () => markAllRead.mutate();
  const handleItemClick = (id: string) => markRead.mutate(id);

  const filtered = useMemo(
    () =>
      notifications
        .filter((n) => (filter === 'all' ? true : n.type === filter))
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
    [notifications, filter],
  );

  const listParentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => listParentRef.current,
    estimateSize: () => 96,
  });

  return (
    <div className="max-w-4xl mx-auto p-6 overflow-x-hidden">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <Button variant="ghost" onClick={handleMarkAllRead}>
          Mark All as Read
        </Button>
      </div>

      <div className="flex gap-4 mb-6 overflow-x-auto w-full">
        {filters.map((f) => (
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
        ))}
      </div>

      {listError && (
        <p className="mb-4 text-danger-red text-sm">
          Failed to load notifications.
        </p>
      )}

      <div ref={listParentRef} className="max-h-[600px] overflow-auto">
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
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const n = filtered[virtualRow.index];
              return (
                <div
                  key={n.id}
                  ref={virtualizer.measureElement}
                  data-index={virtualRow.index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <NotificationItem
                    notification={n}
                    onClick={handleItemClick}
                  />
                </div>
              );
            })}
          </div>
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
