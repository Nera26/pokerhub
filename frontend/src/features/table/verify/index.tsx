'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchHandLog, fetchVerifiedHandProof } from '@/lib/api/hands';
import { revealDeck } from '@/lib/verifyProof';
import type { HandProof } from '@shared/types';

export default function VerifyPage() {
  const search = useSearchParams();
  const handId = search.get('id') ?? '';
  const [proof, setProof] = useState<HandProof | null>(null);
  const [valid, setValid] = useState<boolean | null>(null);
  const [deck, setDeck] = useState<number[] | null>(null);
  const [log, setLog] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!handId) return;
    setLoading(true);
    (async () => {
      try {
        const { proof, valid } = await fetchVerifiedHandProof(handId);
        setProof(proof);
        setValid(valid);
        if (valid) {
          const d = await revealDeck(proof);
          setDeck(d);
        } else {
          setDeck(null);
        }
        const l = await fetchHandLog(handId);
        setLog(l);
        setError('');
      } catch {
        setProof(null);
        setValid(null);
        setDeck(null);
        setLog(null);
        setError('Failed to verify hand');
      } finally {
        setLoading(false);
      }
    })();
  }, [handId]);

  return (
    <main className="container mx-auto px-4 py-6 text-text-primary">
      <h1 className="text-xl font-bold mb-4">Verify Hand</h1>
      {!handId && <p>No hand specified.</p>}
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
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
          {valid !== null && (
            <div>
              <strong>Commitment valid:</strong> {valid ? 'yes' : 'no'}
            </div>
          )}
          {deck && (
            <div>
              <strong>Deck:</strong>
              <pre className="whitespace-pre-wrap break-words">{deck.join(' ')}</pre>
            </div>
          )}
        </div>
      )}
      {log && (
        <div className="mt-4">
          <h2 className="font-semibold mb-2">Hand Log</h2>
          <pre className="whitespace-pre-wrap break-words">{log}</pre>
        </div>
      )}
    </main>
  );
}
