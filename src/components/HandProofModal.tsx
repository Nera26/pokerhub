/* istanbul ignore file */
'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  const [verifying, setVerifying] = useState(false);

  async function handleVerify() {
    if (!data) return;
    setVerifying(true);
    try {
      const ok = await verifyProof(data);
      setValid(ok);
      if (ok) {
        const d = await revealDeck(data);
        setDeck(d);
      } else {
        setDeck(null);
      }
    } catch {
      setValid(null);
      setDeck(null);
    } finally {
      setVerifying(false);
    }
  }

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
          <Link
            href={`/hands/${handId}/proof`}
            className="underline text-accent-blue"
            target="_blank"
            rel="noopener noreferrer"
          >
            View proof page
          </Link>
          <Link
            href={`/table/verify?seed=${encodeURIComponent(data.seed)}&nonce=${encodeURIComponent(data.nonce)}&commitment=${encodeURIComponent(data.commitment)}`}
            className="underline text-accent-blue"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open verifier
          </Link>
          <button
            onClick={handleVerify}
            disabled={verifying}
            className="px-2 py-1 bg-accent-green text-white rounded"
          >
            {verifying ? 'Verifying...' : 'Verify'}
          </button>
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
