'use client';

import PlayerChipStack from './PlayerChipStack';

type Size = 'sm' | 'md' | 'lg';

interface ChipPileProps {
  amount: number;
  size?: Size;
  grounded?: boolean;
}

/**
 * Compact chip pile used for pot and flying chip sprites.
 * Wraps PlayerChipStack for now to reuse styling.
 */
export default function ChipPile({ amount, size = 'sm', grounded = false }: ChipPileProps) {
  return (
    <div className={grounded ? 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]' : ''}>
      <PlayerChipStack amount={amount} size={size} />
    </div>
  );
}

