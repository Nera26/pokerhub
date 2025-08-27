import dynamic from 'next/dynamic';

const ProfilePage = dynamic(() => import('@/features/site/profile'), {
  loading: () => <div>Loading...</div>,
});

export default ProfilePage;
