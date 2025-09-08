import Link from 'next/link';
import { fetchHandState } from '@/lib/api/hands';

export default async function HandPage({
  params,
}: {
  params: { id: string };
}) {
  const hand = await fetchHandState(params.id, 0);

  return (
    <main className="container mx-auto px-4 py-6 text-text-primary">
      <h1 className="text-xl font-bold mb-4">Hand {params.id}</h1>
      <p className="mb-4">Pot: {hand.pot}</p>
      <ul className="mb-4">
        {hand.players.map((p) => (
          <li key={p.id}>
            {p.id}: {p.stack}
          </li>
        ))}
      </ul>
      <Link
        href={`/hand/${params.id}/proof`}
        className="underline text-accent-blue"
      >
        View proof
      </Link>
    </main>
  );
}
