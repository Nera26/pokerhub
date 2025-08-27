'use client';

import React from 'react';
import BetIndicator from './BetIndicator';

interface ActionBubbleProps {
  committed: number;
  lastAction?: string;
}

export default function ActionBubble({
  committed,
  lastAction,
}: ActionBubbleProps) {
  const actionActive = committed > 0 || !!lastAction;
  const [showAction, setShowAction] = React.useState(actionActive);

  React.useEffect(() => {
    if (actionActive) {
      setShowAction(true);
    } else {
      const t = setTimeout(() => setShowAction(false), 200);
      return () => clearTimeout(t);
    }
  }, [actionActive]);

  if (!showAction) return null;

  return (
    <>
      <BetIndicator
        amount={committed}
        className={`transition-opacity duration-200 ${actionActive ? 'opacity-100' : 'opacity-0'}`}
      />
      {lastAction && (
        <div
          className={[
            'pointer-events-none absolute left-1/2 -translate-x-1/2 -top-2 -translate-y-full rounded bg-black/80 px-2 py-1 text-xs text-white',
            'transition-opacity transition-transform duration-200',
            actionActive
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 -translate-y-1',
          ].join(' ')}
        >
          {lastAction}
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-x-4 border-x-transparent border-t-4 border-t-black/80" />
        </div>
      )}
    </>
  );
}
