import createDynamicPage from '@/app/utils/createDynamicPage';

export default createDynamicPage(() => import('@/features/site/profile'));
