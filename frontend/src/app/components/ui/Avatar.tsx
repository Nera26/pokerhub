'use client';

export default function Avatar({
  name = 'N',
  size = 28,
}: {
  /** Full name used for accessible label */
  name?: string;
  /** Avatar diameter in pixels */
  size?: number;
}) {
  const initials = name.slice(0, 1).toUpperCase();
  return (
    <div
      role="img"
      aria-label={name}
      className="rounded-full bg-hover-bg border border-dark grid place-items-center"
      style={{ width: size, height: size }}
    >
      <span className="text-xs text-secondary">{initials}</span>
    </div>
  );
}
