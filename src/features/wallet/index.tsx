'use client';

import { useWallet } from './useWallet';

export default function WalletPage() {
  const { data, isLoading, error } = useWallet();

  return (
    <main id="main-content" className="p-4">
      <h1 className="text-2xl font-bold mb-4">Wallet</h1>
      {isLoading ? (
        <p>Loading...</p>
      ) : error || !data ? (
        <p>Failed to load wallet</p>
      ) : (
        <div>
          <p>Real Balance: {data.realBalance}</p>
          <p>Credit Balance: {data.creditBalance}</p>
        </div>
      )}
    </main>
  );
}
