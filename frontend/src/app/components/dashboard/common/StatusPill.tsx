'use client';

interface StatusPillProps {
  label: string;
  className: string;
}

export default function StatusPill({ label, className }: StatusPillProps) {
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}
