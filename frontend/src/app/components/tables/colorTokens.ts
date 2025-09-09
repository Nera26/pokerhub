export const HAIRLINE = 'var(--color-hairline)';

export const POSITION_RING: Record<
  string,
  { color: string; glow: string; badge?: string }
> = {
  BTN: {
    color: 'hsl(44,88%,60%)',
    glow: 'hsla(44,88%,60%,0.45)',
    badge: '/badges/btn.svg',
  },
  SB: {
    color: 'hsl(202,90%,60%)',
    glow: 'hsla(202,90%,60%,0.45)',
    badge: '/badges/sb.svg',
  },
  BB: {
    color: 'hsl(275,85%,65%)',
    glow: 'hsla(275,85%,65%,0.45)',
    badge: '/badges/bb.svg',
  },
  UTG: { color: 'var(--color-pos-utg)', glow: 'var(--glow-pos-utg)' },
  MP: { color: 'var(--color-pos-mp)', glow: 'var(--glow-pos-mp)' },
  CO: { color: 'var(--color-pos-co)', glow: 'var(--glow-pos-co)' },
  HJ: { color: 'var(--color-pos-hj)', glow: 'var(--glow-pos-hj)' },
  LJ: { color: 'var(--color-pos-lj)', glow: 'var(--glow-pos-lj)' },
};
