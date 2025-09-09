import { QueryClient, dehydrate } from '@tanstack/react-query';
import Hydrate from '@/app/Hydrate';
import dynamic from 'next/dynamic';
// Lazily load the heavy client component to keep the server bundle small
const HomePageClient = dynamic(
  () => import('@/app/(site)/HomePageClient').then((mod) => mod.HomePageClient),
  {
    // The page has a lightweight placeholder while the component loads
    loading: () => <div>Loading...</div>,
  },
);
import { fetchTables, fetchTournaments } from '@/lib/api/lobby';

export const metadata = {
  title: 'PokerHub',
  description: 'Explore live tables and upcoming tournaments on PokerHub.',
};

export default async function Page() {
  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['tables'],
      queryFn: ({ signal }) => fetchTables({ signal }),
    }),
    queryClient.prefetchQuery({
      queryKey: ['tournaments'],
      queryFn: ({ signal }) => fetchTournaments({ signal }),
    }),
  ]);

  return (
    <Hydrate state={dehydrate(queryClient)}>
      <HomePageClient />
    </Hydrate>
  );
}
