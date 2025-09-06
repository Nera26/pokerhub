import type { HandProof } from '@shared/types';

export default function ProofDetails({
  proof,
  valid,
  deck,
}: {
  proof: HandProof;
  valid?: boolean;
  deck: number[] | null;
}) {
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
      {valid !== undefined && (
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
  );
}
