import dynamic from 'next/dynamic';
import LoadingSection from '@/components/LoadingSection';

interface PageProps {
  params: { id: string };
}

const TablePageClient = dynamic(() => import('./TablePageClient'), {
  loading: () => <LoadingSection />,
});

export default function TablePage({ params }: PageProps) {
  return <TablePageClient tableId={params.id} />;
}
