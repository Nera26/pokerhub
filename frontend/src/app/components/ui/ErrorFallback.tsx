'use client';

export default function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <h2 className="mb-4 text-xl font-semibold">Something went wrong</h2>
      <button
        type="button"
        className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        onClick={onRetry}
      >
        Try again
      </button>
    </div>
  );
}
