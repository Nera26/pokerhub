'use client';

import { useEffect, useState } from 'react';
import { verifyProof } from '@/lib/verifyProof';
import type { HandProof } from '@shared/types';

export default function HandHistoryPage({ params }: { params: { handId: string } }) {
  const [proof, setProof] = useState<HandProof | null>(null);
  const [valid, setValid] = useState<boolean | null>(null);

  useEffect(() => {
    async function run() {
      try {
        const res = await fetch('/game/proof');
        if (!res.ok) throw new Error('failed to fetch proof');
        const data = (await res.json()) as HandProof;
        setProof(data);
        setValid(await verifyProof(data));
      } catch {
        setValid(false);
      }
    }
    run();
  }, []);

  return (
    <main className="container mx-auto px-4 py-6 text-text-primary">
      <h1 className="text-xl font-bold mb-4">Hand {params.handId}</h1>
      {valid === null && <p>Loading proof...</p>}
      {valid === false && <p className="text-danger-red">Invalid proof</p>}
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
