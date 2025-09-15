'use client';

import SkeletonSection from '@/app/components/common/SkeletonSection';
import { useHandState } from '@/hooks/useHandState';
import { useParams, useSearchParams } from 'next/navigation';

export default function LoadingHandPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const frameParam = searchParams.get('frame');
  const frame = Number.isNaN(Number(frameParam)) ? 0 : Number(frameParam ?? 0);
  const { data, error, isLoading } = useHandState(id as string, frame);

  return (
    <SkeletonSection className="px-4 py-6 text-text-primary" rows={0}>
      {error && <p className="mb-4 text-error">{(error as Error).message}</p>}

      {data && (
        <>
          <h1 className="text-xl font-bold mb-4">Hand {id}</h1>
          <p className="mb-2">Frame: {frame}</p>
          <p className="mb-4">Pot: {data.pot}</p>
        </>
      )}

      {isLoading && (
        <SkeletonSection rows={2} cardHeight="h-10" fullPage={false} />
      )}
    </SkeletonSection>
  );
}
