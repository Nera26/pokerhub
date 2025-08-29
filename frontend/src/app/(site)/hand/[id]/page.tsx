import Link from 'next/link';

export default function HandPage({ params }: { params: { id: string } }) {
  return (
    <main className="container mx-auto px-4 py-6 text-text-primary">
      <h1 className="text-xl font-bold mb-4">Hand {params.id}</h1>
      <Link
        href={`/hand/${params.id}/proof`}
        className="underline text-accent-blue"
      >
        View proof
      </Link>
    </main>
  );
}
