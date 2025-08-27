import dynamic from 'next/dynamic';

const NotificationPage = dynamic(() => import('@/features/site/notification'), {
  loading: () => <div>Loading...</div>,
});

export default NotificationPage;
