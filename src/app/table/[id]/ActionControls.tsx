'use client';

interface Props {
  onAction: (action: Record<string, unknown>) => void;
  disabled?: boolean;
}

export default function ActionControls({ onAction, disabled }: Props) {
  return (
    <div className="space-x-2" data-testid="actions">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onAction({ type: 'bet', amount: 1 })}
        className="px-2 py-1 border rounded"
      >
        Bet 1
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onAction({ type: 'call' })}
        className="px-2 py-1 border rounded"
      >
        Call
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onAction({ type: 'fold' })}
        className="px-2 py-1 border rounded"
      >
        Fold
      </button>
    </div>
  );
}

