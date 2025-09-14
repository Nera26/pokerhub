'use client';

import RouteSkeleton from '@/components/RouteSkeleton';
import LoadingSection from '@/components/LoadingSection';
import { fetchHandState } from '@/lib/api/hands';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

export default function LoadingHandPage() {
  const { id } = useParams();
  const { data } = useQuery({
    queryKey: ['hand', id],
    queryFn: () => fetchHandState(id as string, 0),
    enabled: typeof id === 'string',
  });

  return (
    <RouteSkeleton className="px-4 py-6 text-text-primary" rows={0}>
      {data && (
        <>
          <h1 className="text-xl font-bold mb-4">Hand {id}</h1>
          <p className="mb-4">Pot: {data.pot}</p>
        </>
      )}
      <LoadingSection />
    </RouteSkeleton>
  );
}
