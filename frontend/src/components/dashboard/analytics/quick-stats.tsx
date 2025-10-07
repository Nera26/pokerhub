'use client';

interface Props {
  total: number;
  errors: number;
  logins: number;
}

export default function QuickStats({ total, errors, logins }: Props) {
  return (
    <div className="bg-card-bg p-6 rounded-2xl shadow-[0_4px_8px_rgba(0,0,0,0.3)]">
      <h3 className="text-lg font-bold mb-4">Today&apos;s Events</h3>
      <div className="space-y-3 select-none">
        <div className="flex justify-between">
          <span className="text-text-secondary">Total Events</span>
          <span className="font-bold text-accent-yellow">{total}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">Errors</span>
          <span className="font-bold text-danger-red">{errors}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">Logins</span>
          <span className="font-bold text-accent-green">{logins}</span>
        </div>
      </div>
    </div>
  );
}
