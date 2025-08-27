import dynamic from 'next/dynamic';

const TablePage = dynamic(() => import('@/features/table'), {
  loading: () => <div>Loading...</div>,
});

export default TablePage;
