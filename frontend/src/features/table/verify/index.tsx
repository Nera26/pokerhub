'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { verifyProof, revealDeck } from '@/lib/verify';

export default function VerifyPage() {
  const search = useSearchParams();
  const [seed, setSeed] = useState('');
  const [nonce, setNonce] = useState('');
  const [commitment, setCommitment] = useState('');
  const [valid, setValid] = useState<boolean | null>(null);
  const [deck, setDeck] = useState<number[] | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    setSeed(search.get('seed') ?? '');
    setNonce(search.get('nonce') ?? '');
    setCommitment(search.get('commitment') ?? '');
  }, [search]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const proof = { seed, nonce, commitment };
    setVerifying(true);
    try {
      const ok = await verifyProof(proof);
      setValid(ok);
      if (ok) {
        const d = await revealDeck(proof);
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
    <main className="container mx-auto px-4 py-6 text-text-primary">
      <h1 className="text-xl font-bold mb-4">Verify Hand</h1>
      <form onSubmit={handleVerify} className="space-y-2">
        <div>
          <label className="block mb-1">Seed</label>
          <input
            className="w-full px-2 py-1 border rounded"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1">Nonce</label>
          <input
            className="w-full px-2 py-1 border rounded"
            value={nonce}
            onChange={(e) => setNonce(e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1">Commitment</label>
          <input
            className="w-full px-2 py-1 border rounded"
            value={commitment}
            onChange={(e) => setCommitment(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={verifying}
          className="px-4 py-2 bg-accent-green text-white rounded"
        >
          {verifying ? 'Verifying...' : 'Verify'}
        </button>
      </form>
      {valid !== null && (
        <p className="mt-4">Commitment valid: {valid ? 'yes' : 'no'}</p>
      )}
      {deck && (
        <div className="mt-4">
          <h2 className="font-semibold mb-2">Deck order</h2>
          <pre className="whitespace-pre-wrap break-words">{deck.join(' ')}</pre>
        </div>
      )}
    </main>
  );
}

