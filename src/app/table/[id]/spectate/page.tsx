import SpectatorTable from '@/features/table/spectator';

export default function SpectatePage({ params }: { params: { id: string } }) {
  return <SpectatorTable tableId={params.id} />;
}

