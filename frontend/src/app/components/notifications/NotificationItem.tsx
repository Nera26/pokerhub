'use client';

import Tooltip from '../ui/Tooltip';
import type { Notification } from '@/lib/api/notifications';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons/faBell';
import { faGift } from '@fortawesome/free-solid-svg-icons/faGift';
import { faTrophy } from '@fortawesome/free-solid-svg-icons/faTrophy';

export interface NotificationItemProps {
  notification: Notification;
  onClick?: (id: string) => void;
}

// Helper to format elapsed time
function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationItem({
  notification,
  onClick,
}: NotificationItemProps) {
  const { id, type, title, message, timestamp, read } = notification;

  // Icon class and color based on type
  let icon = faBell;
  let iconColor = 'text-danger-red';
  if (type === 'bonus') {
    icon = faGift;
    iconColor = 'text-accent-yellow';
  } else if (type === 'tournament') {
    icon = faTrophy;
    iconColor = 'text-accent-yellow';
  }

  const containerClasses = [
    'flex items-start gap-4 p-5 rounded-2xl transition-colors duration-200',
    'bg-card-bg',
    !read && 'border-l-4 border-accent-yellow shadow-lg',
  ]
    .filter(Boolean)
    .join(' ');

  const titleClasses = [
    'font-semibold',
    read ? 'text-text-secondary' : 'text-text-primary',
  ].join(' ');

  return (
    <div className={containerClasses} onClick={() => onClick?.(id)}>
      <div className={['text-xl', 'text-text-secondary', iconColor].join(' ')}>
        <FontAwesomeIcon icon={icon} />
      </div>
      <div className="flex-grow">
        <div className="flex justify-between items-start mb-1">
          <h3 className={titleClasses}>{title}</h3>
          <Tooltip text={timestamp.toLocaleString()}>
            <span className="text-text-secondary text-sm">
              {timeAgo(timestamp)}
            </span>
          </Tooltip>
        </div>
        <p className="text-text-secondary text-sm">{message}</p>
      </div>
    </div>
  );
}
