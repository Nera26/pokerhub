export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-2xl font-bold">You are offline</h1>
      <p className="mt-4 text-text-secondary">
        Some features may be unavailable. Please check your connection and try
        again.
      </p>
    </div>
  );
}
