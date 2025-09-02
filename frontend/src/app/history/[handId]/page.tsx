'use client';

import { useEffect, useState } from 'react';
import { verifyProof } from '@/lib/verifyProof';
import type { HandProof } from '@shared/types';

export default function HandHistoryPage({ params }: { params: { handId: string } }) {
  const [proof, setProof] = useState<HandProof | null>(null);
  const [valid, setValid] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      try {
        const res = await fetch(`/api/hands/${params.handId}/proof`);
        if (res.status === 404) {
          setError('Proof not found');
          setValid(false);
          return;
        }
        if (res.status === 401 || res.status === 403) {
          setError('You do not have access to this proof');
          setValid(false);
          return;
        }
        if (!res.ok) throw new Error('failed to fetch proof');
        const data = (await res.json()) as HandProof;
        setProof(data);
        setValid(await verifyProof(data));
      } catch {
        setError('Failed to fetch proof');
        setValid(false);
      }
    }
    run();
  }, [params.handId]);

  return (
    <main className="container mx-auto px-4 py-6 text-text-primary">
      <h1 className="text-xl font-bold mb-4">Hand {params.handId}</h1>
      {valid === null && !error && <p>Loading proof...</p>}
      {error && <p className="text-danger-red">{error}</p>}
      {valid === false && !error && <p className="text-danger-red">Invalid proof</p>}
      {valid && proof && (
        <div className="space-y-2 break-words">
          <div>
            <strong>Commitment:</strong> {proof.commitment}
          </div>
          <div>
            <strong>Seed:</strong> {proof.seed}
          </div>
          <div>
            <strong>Nonce:</strong> {proof.nonce}
          </div>
          <p className="text-accent-green">Proof verified</p>
        </div>
      )}
    </main>
  );
}
