'use client';

import { useEffect, useState } from 'react';

const EVENT_NAME = 'contract-mismatch';

export function dispatchContractMismatch() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EVENT_NAME));
  }
}

export default function ContractMismatchNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(true);
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center">
      <div className="m-4 rounded-md bg-danger-red text-white px-4 py-2 flex items-center gap-4" role="alert">
        <span>A new version is available. Please refresh the page.</span>
        <button
          type="button"
          className="underline"
          onClick={() => setVisible(false)}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
