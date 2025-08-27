'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons/faTimes';
import Button from '../ui/Button';
import { Promotion } from '../promotions/PromotionCard';

export interface PromotionDetailModalContentProps {
  /** The promotion for which details are shown */
  promotion: Promotion;
  /** Callback to close the modal */
  onClose: () => void;
}

export default function PromotionDetailModalContent({
  promotion,
  onClose,
}: PromotionDetailModalContentProps) {
  const { title, progress, unlockText } = promotion;
  const isProgressMode = !!progress;
  const isUnlockMode = !!unlockText && !progress;

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
              <li>
                Cashed hands: <span className="font-semibold">$200</span>
              </li>
              <li>
                Showdown wins: <span className="font-semibold">$150</span>
              </li>
            </ul>
            <p className="italic text-xs">
              Keep wagering on cash games to complete the challenge. Estimated
              time to completion: ~2 hours of average play.
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
              You have currently played <span className="font-semibold">2</span>{' '}
              tournaments this week.
            </p>
          </>
        )}
      </div>

      {/* Footer with Close button */}
      <div className="mt-6 text-right">
        <Button variant="primary" onClick={onClose}>
          Close
        </Button>
      </div>
    </>
  );
}
