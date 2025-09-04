import { QueryClient, dehydrate } from '@tanstack/react-query';
import Hydrate from '@/app/Hydrate';
import { fetchTable } from '@/lib/api/table';
import TablePageClient from '@/app/table/[id]/TablePageClient';

export default async function TablePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tableId = id ?? '00000';

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ['table', tableId],
    queryFn: ({ signal }) => fetchTable(tableId, { signal }),
  });

  return (
    <Hydrate state={dehydrate(queryClient)}>
      <TablePageClient tableId={tableId} />
    </Hydrate>
  );
}
