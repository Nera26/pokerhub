'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTableData } from '@/hooks/useTableData';
import { useApiError } from '@/hooks/useApiError';
import useGameSocket from '@/hooks/useGameSocket';
import FairnessModal from '@/components/FairnessModal';
import CenteredMessage from '@/components/CenteredMessage';
import { EVENT_SCHEMA_VERSION } from '@shared/events';

const PokerTableLayout = dynamic(
  () => import('../../components/tables/PokerTableLayout'),
  {
    loading: () => (
      <CenteredMessage>Loading table...</CenteredMessage>
    ),
  },
);

export default function TablePageClient({ tableId }: { tableId: string }) {
  const { data, error, isLoading } = useTableData(tableId);
  const errorMessage = useApiError(error);
  const { socket } = useGameSocket();
  const [proofHandId, setProofHandId] = useState<string | null>(null);
  const [showProof, setShowProof] = useState(false);

  useEffect(() => {
    if (!socket) return;
    const handleEnd = (e: { handId: string; version: string }) => {
      if (e.version !== EVENT_SCHEMA_VERSION) return;
      setProofHandId(e.handId);
      setShowProof(false);
    };
    socket.on('hand.end', handleEnd);
    return () => {
      socket.off('hand.end', handleEnd);
    };
  }, [socket]);

  if (isLoading) {
    return <CenteredMessage>Loading table...</CenteredMessage>;
  }

  if (!data) {
    return (
      <CenteredMessage>
        {errorMessage ?? 'Table not found.'}
      </CenteredMessage>
    );
  }

  if (!data.stateAvailable) {
    return <CenteredMessage>Table state unavailable.</CenteredMessage>;
  }

  if (data.players.length === 0) {
    return (
      <CenteredMessage>No players at this table.</CenteredMessage>
    );
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
      {proofHandId && (
        <div className="mt-2 flex gap-4 text-sm">
          <button
            type="button"
            onClick={() => setShowProof(true)}
            className="underline text-accent-blue"
          >
            Verify Hand
          </button>
          <a
            href={`/api/hands/${proofHandId}/proof`}
            download={`hand-${proofHandId}-proof.json`}
            className="underline text-accent-blue"
          >
            Download Proof
          </a>
        </div>
      )}
      <FairnessModal
        handId={proofHandId ?? ''}
        isOpen={showProof}
        onClose={() => setShowProof(false)}
      />
    </>
  );
}
