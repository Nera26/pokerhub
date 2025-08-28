'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTableData } from '@/hooks/useTableData';
import { useApiError } from '@/hooks/useApiError';
import useGameSocket from '@/hooks/useGameSocket';
import HandProofModal from '@/components/HandProofModal';

const PokerTableLayout = dynamic(
  () => import('../../components/tables/PokerTableLayout'),
  {
    loading: () => <p className="text-center mt-8">Loading table...</p>,
  },
);

export default function TablePageClient({ tableId }: { tableId: string }) {
  const { data, error, isLoading } = useTableData(tableId);
  const errorMessage = useApiError(error);
  const { socket } = useGameSocket();
  const [proofHandId, setProofHandId] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return;
    const handleEnd = (e: { handId: string }) => {
      setProofHandId(e.handId);
    };
    socket.on('hand.end', handleEnd);
    return () => {
      socket.off('hand.end', handleEnd);
    };
  }, [socket]);

  if (isLoading) {
    return <p className="text-center mt-8">Loading table...</p>;
  }

  if (!data) {
    return (
      <p className="text-center mt-8">{errorMessage ?? 'Table not found.'}</p>
    );
  }

  if (data.players.length === 0) {
    return <p className="text-center mt-8">No players at this table.</p>;
  }

  return (
    <>
      <PokerTableLayout
        tableId={tableId}
        smallBlind={data.smallBlind}
        bigBlind={data.bigBlind}
        pot={data.pot}
        communityCards={data.communityCards}
        players={data.players}
        heroId={data.players[0].id}
        chatMessages={data.chatMessages}
      />
      <HandProofModal
        handId={proofHandId ?? ''}
        isOpen={proofHandId !== null}
        onClose={() => setProofHandId(null)}
      />
    </>
  );
}
