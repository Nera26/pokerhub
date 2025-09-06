import dynamic from 'next/dynamic';

interface PageProps {
  params: { id: string };
}

const TablePageClient = dynamic(() => import('./TablePageClient'), {
  loading: () => <div>Loading...</div>,
});

export default function TablePage({ params }: PageProps) {
  return <TablePageClient tableId={params.id} />;
}
