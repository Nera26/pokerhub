'use client';

import Link from 'next/link';
import Button from '../ui/Button';

export default function TopCTAs() {
  return (
    <div className="flex gap-4 mb-6">
      <Link href="#cash-games-panel">
        <Button variant="primary">Join a Live Table</Button>
      </Link>
      <Link href="#tournaments-panel">
        <Button variant="outline">View Tournaments</Button>
      </Link>
    </div>
  );
}
