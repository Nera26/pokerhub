/* istanbul ignore file */
'use client';

import { useEffect, useState } from 'react';
import Modal from '@/app/components/ui/Modal';
import { useHandProof } from '@/hooks/useHandProof';
import { verifyProof, revealDeck } from '@/lib/verify';

interface HandProofModalProps {
  handId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function HandProofModal({ handId, isOpen, onClose }: HandProofModalProps) {
  const { data, isLoading, error } = useHandProof(handId, isOpen);
  const [deck, setDeck] = useState<number[] | null>(null);
  const [valid, setValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (data) {
      verifyProof(data).then(setValid).catch(() => setValid(null));
      revealDeck(data).then(setDeck).catch(() => setDeck(null));
    } else {
      setValid(null);
      setDeck(null);
    }
  }, [data]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-lg font-bold mb-4">Hand Proof</h2>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error loading proof</p>}
      {data && (
        <div className="space-y-2 break-words">
          <div>
            <strong>Seed:</strong> {data.seed}
          </div>
          <div>
            <strong>Nonce:</strong> {data.nonce}
          </div>
          <div>
            <strong>Commitment:</strong> {data.commitment}
          </div>
          {valid !== null && (
            <div>
              <strong>Commitment valid:</strong> {valid ? 'yes' : 'no'}
            </div>
          )}
          {deck && (
            <div>
              <strong>Deck:</strong>
              <pre className="whitespace-pre-wrap">{deck.join(' ')}</pre>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
