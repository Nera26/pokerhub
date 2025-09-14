'use client';

import RouteSkeleton from '@/components/RouteSkeleton';
import LoadingSection from '@/components/LoadingSection';
import { useHandState } from '@/hooks/useHandState';
import { useParams } from 'next/navigation';

export default function LoadingHandPage() {
  const { id } = useParams();
  const frame = 0;
  const { data, error, isLoading } = useHandState(id as string, frame);

  return (
    <RouteSkeleton className="px-4 py-6 text-text-primary" rows={0}>
      {error && <p className="mb-4 text-error">{(error as Error).message}</p>}

      {data && (
        <>
          <h1 className="text-xl font-bold mb-4">Hand {id}</h1>
          <p className="mb-2">Frame: {frame}</p>
          <p className="mb-4">Pot: {data.pot}</p>
        </>
      )}

      {isLoading && <LoadingSection />}
    </RouteSkeleton>
  );
}
