'use client';

import { useAuth } from '@/context/AuthContext';

export default function WalletPage() {
  const { realBalance, creditBalance, isLoading, error } = useAuth();

  return (
    <main id="main-content" className="p-4">
      <h1 className="text-2xl font-bold mb-4">Wallet</h1>
      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>Failed to load wallet</p>
      ) : (
        <div>
          <p>Real Balance: {realBalance}</p>
          <p>Credit Balance: {creditBalance}</p>
        </div>
      )}
    </main>
  );
}
