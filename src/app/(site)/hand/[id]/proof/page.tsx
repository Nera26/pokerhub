import dynamic from 'next/dynamic';

const Proof = dynamic(() => import('../Proof'), {
  loading: () => <div>Loading...</div>,
});

export default function ProofPage({ params }: { params: { id: string } }) {
  return <Proof handId={params.id} />;
}
