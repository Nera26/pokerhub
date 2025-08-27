import dynamic from 'next/dynamic';

const TableDetailPage = dynamic(() => import('@/features/table/detail'), {
  loading: () => <div>Loading...</div>,
});

export default TableDetailPage;
