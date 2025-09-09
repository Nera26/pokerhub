'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons/faTimes';
import Button from '../ui/Button';
import { Promotion } from '../promotions/PromotionCard';

export interface PromotionDetailModalContentProps {
  /** The promotion for which details are shown */
  promotion: Promotion;
  /** Callback to close the modal */
  onClose: () => void;
  /** Optional action for the promotion (e.g. claim) */
  onAction?: () => void;
  /** Whether an action is in progress */
  isLoading?: boolean;
  /** Error message from action */
  error?: string | null;
  /** Whether the action succeeded */
  success?: boolean;
}

export default function PromotionDetailModalContent({
  promotion,
  onClose,
  onAction,
  isLoading = false,
  error,
  success,
}: PromotionDetailModalContentProps) {
  const { title, progress, unlockText, breakdown, eta } = promotion;
  const isProgressMode = !!progress;
  const isUnlockMode = !!unlockText && !progress;
  const tournamentsPlayed =
    breakdown.find((b) => b.label === 'Tournaments Played')?.value ?? 0;

  return (
    <>
      {/* Header with title and close button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-text-primary">
          {isProgressMode
            ? `${title} Progress`
            : isUnlockMode
              ? `${title} Unlock`
              : title}
        </h2>
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-text-secondary hover:text-accent-yellow focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-yellow rounded"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      {/* Body content */}
      <div className="space-y-4 text-text-secondary text-sm">
        {isProgressMode && progress && (
          <>
            <p className="mb-2">
              You have wagered{' '}
              <span className="font-semibold">${progress.current}</span> out of{' '}
              <span className="font-semibold">${progress.total}</span> required
              this period.
            </p>
            <p className="mb-2">
              Tracks 100% of cash game wagers. Your current streak is:
            </p>
            <ul className="list-disc list-inside mb-2">
              {breakdown.map(({ label, value }) => (
                <li key={label}>
                  {label}: <span className="font-semibold">${value}</span>
                </li>
              ))}
            </ul>
            <p className="italic text-xs">
              Keep wagering on cash games to complete the challenge. Estimated
              time to completion: {eta}
            </p>
          </>
        )}

        {isUnlockMode && (
          <>
            <p className="mb-2">{unlockText}</p>
            <p className="italic text-xs">
              Tournament play includes Sit &amp; Gos, MTTs, and Freezeouts.
              Progress is tracked 24/7.
            </p>
            <p className="italic text-xs mt-2">
              You have currently played{' '}
              <span className="font-semibold">{tournamentsPlayed}</span>{' '}
              tournaments this week.
            </p>
          </>
        )}
      </div>

      {/* Footer with actions */}
      <div className="mt-6 text-right space-y-2">
        {error && (
          <div role="alert" className="text-red-500">
            {error}
          </div>
        )}
        {success && (
          <div role="status" className="text-accent-green">
            Promotion claimed successfully!
          </div>
        )}
        <div className="space-x-2">
          {onAction && !success && (
            <Button variant="primary" onClick={onAction} disabled={isLoading}>
              {isLoading ? 'Claiming...' : 'Claim'}
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </>
  );
}
