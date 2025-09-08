'use client';

import { useEffect } from 'react';

export default function HandError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="p-4 text-red-500">
      Failed to load hand.
      <button className="ml-2 underline" onClick={() => reset()}>Retry</button>
    </div>
  );
}
