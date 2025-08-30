'use client';

import { downloadHandProof } from '@/lib/api/hands';

export default function ProofDownloadButton({ handId }: { handId: string }) {
  return (
    <button
      onClick={() => downloadHandProof(handId)}
      className="underline text-accent-blue"
    >
      Download proof JSON
    </button>
  );
}
