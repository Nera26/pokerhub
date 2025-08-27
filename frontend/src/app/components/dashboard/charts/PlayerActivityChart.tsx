'use client';

export default function PlayerActivityChart({
  values = [20, 15, 40, 60, 140, 200, 160],
  labels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
}: {
  values?: number[];
  labels?: string[];
}) {
  const W = 980,
    H = 300,
    p = 36,
    max = 220,
    min = 0;

  const xStep = (W - p * 2) / (values.length - 1);
  const y = (v: number) => H - p - ((v - min) / (max - min)) * (H - p * 2);
  const pts = values.map((v, i) => [p + i * xStep, y(v)] as const);
  const d = pts.map((pt, i) => (i ? 'L' : 'M') + pt[0] + ',' + pt[1]).join(' ');

  return (
    <div className="rounded-xl border border-dark bg-primary-bg">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-64"
        role="img"
        aria-labelledby="player-activity-title"
        aria-describedby="player-activity-desc"
      >
        <title id="player-activity-title">Player activity over 24 hours</title>
        <desc id="player-activity-desc">
          Line chart showing number of active players at four-hour intervals throughout the day.
        </desc>

        {[1, 2, 3, 4].map((i) => {
          const yLine = p + (i * (H - p * 2)) / 5;
          return (
            <line
              key={i}
              x1={p}
              x2={W - p}
              y1={yLine}
              y2={yLine}
              stroke="var(--color-border-dark)"
              strokeWidth="1"
            />
          );
        })}

        <path
          d={d}
          fill="none"
          stroke="var(--color-accent-yellow)"
          strokeWidth="4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {labels.map((t, i) => (
          <text
            key={i}
            x={p + i * xStep}
            y={H - 8}
            textAnchor="middle"
            fontSize="11"
            fill="var(--color-text-secondary)"
          >
            {t}
          </text>
        ))}
      </svg>
    </div>
  );
}
