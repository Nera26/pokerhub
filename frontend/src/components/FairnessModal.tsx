/* istanbul ignore file */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Modal from '@/app/components/ui/Modal';
import { fetchHandProof } from '@/lib/api/hands';
import { verifyProof } from '@/lib/verifyProof';
import type { HandProof } from '@shared/types';

interface FairnessModalProps {
  handId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function FairnessModal({
  handId,
  isOpen,
  onClose,
}: FairnessModalProps) {
  const [proof, setProof] = useState<HandProof | null>(null);
  const [valid, setValid] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (isOpen) {
      fetchHandProof(handId)
        .then(async (p) => {
          if (cancelled) return;
          setProof(p);
          try {
            const ok = await verifyProof(p);
            if (!cancelled) setValid(ok);
          } catch {
            if (!cancelled) setValid(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setProof(null);
            setValid(null);
          }
        });
    }
    return () => {
      cancelled = true;
    };
  }, [handId, isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-lg font-bold mb-4">Fairness Proof</h2>
      {!proof && <p>Loading...</p>}
      {proof && (
        <div className="space-y-2 break-words">
          <div>
            <strong>Seed:</strong> {proof.seed}
          </div>
          <div>
            <strong>Nonce:</strong> {proof.nonce}
          </div>
          <div>
            <strong>Commitment:</strong> {proof.commitment}
          </div>
          <Link
            href={`/hands/${handId}/proof`}
            className="underline text-accent-blue"
            target="_blank"
            rel="noopener noreferrer"
          >
            View proof page
          </Link>
          {valid !== null && (
            <div>
              <strong>Verification:</strong> {valid ? 'valid' : 'invalid'}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
