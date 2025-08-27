'use client';

import NotificationList from '@/app/components/notifications/NotificationList';

export default function NotificationsPage() {
  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-[calc(env(safe-area-inset-bottom)+72px)] overflow-x-hidden">
        <NotificationList />
      </div>
    </>
  );
}
