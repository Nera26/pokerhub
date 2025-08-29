import { fetchHandProof } from '@/lib/api/hands';
import { verifyProof } from '@/lib/verifyProof';

export default async function Proof({ handId }: { handId: string }) {
  const proof = await fetchHandProof(handId);
  const valid = await verifyProof(proof);
  return (
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
      <div>
        <strong>Verification:</strong> {valid ? 'valid' : 'invalid'}
      </div>
    </div>
  );
}
