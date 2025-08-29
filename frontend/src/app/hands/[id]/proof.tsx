'use client';

import { useHandProof } from '@/hooks/useHandProof';

export default function HandProofPage({ params }: { params: { id: string } }) {
  const { data, isLoading, error } = useHandProof(params.id);

  return (
    <main className="container mx-auto px-4 py-6 text-text-primary">
      <h1 className="text-xl font-bold mb-4">Hand Proof</h1>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error loading proof</p>}
      {data && (
        <div className="space-y-2 break-words">
          <div>
            <strong>Commitment:</strong> {data.commitment}
          </div>
          <div>
            <strong>Seed:</strong> {data.seed}
          </div>
          <div>
            <strong>Nonce:</strong> {data.nonce}
          </div>
        </div>
      )}
    </main>
  );
}
