import { fetchHandProof } from '@/lib/api/hands';
import { verifyProof } from '@shared/verify';
import ProofDownloadButton from './ProofDownloadButton';
import ProofDetails from '@/components/hand/ProofDetails';

export default async function Proof({ handId }: { handId: string }) {
  const proof = await fetchHandProof(handId);
  const valid = await verifyProof(proof);
  return (
    <div className="space-y-2 break-words">
      <ProofDetails proof={proof} valid={valid} deck={proof.deck ?? null} />
      <ProofDownloadButton handId={handId} />
    </div>
  );
}
