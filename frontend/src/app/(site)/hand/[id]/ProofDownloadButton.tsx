'use client';

import { downloadHandProof } from '@/lib/api/hands';
import Button from '@/app/components/ui/Button';

export default function ProofDownloadButton({ handId }: { handId: string }) {
  return (
    <Button
      variant="ghost"
      onClick={() => downloadHandProof(handId)}
      className="underline text-accent-blue px-0 py-0"
    >
      Download proof JSON
    </Button>
  );
}
