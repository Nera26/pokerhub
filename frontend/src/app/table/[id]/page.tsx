import dynamic from 'next/dynamic';
import SkeletonSection from '@/app/components/common/SkeletonSection';

interface PageProps {
  params: { id: string };
}

const TablePageClient = dynamic(() => import('./TablePageClient'), {
  loading: () => (
    <SkeletonSection rows={2} cardHeight="h-10" fullPage={false} />
  ),
});

export default function TablePage({ params }: PageProps) {
  return <TablePageClient tableId={params.id} />;
}
