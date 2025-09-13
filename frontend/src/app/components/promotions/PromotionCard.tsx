// Motion transition: m.base
'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGift } from '@fortawesome/free-solid-svg-icons/faGift';
import { faKey } from '@fortawesome/free-solid-svg-icons/faKey';
import SmoothButton from '../ui/SmoothButton';
import dynamic from 'next/dynamic';
import { m } from '@/lib/motion';
import Tooltip from '../ui/Tooltip';
import type { Promotion as BasePromotion } from '@shared/types';

const MotionDiv = dynamic(
  () => import('framer-motion').then((mod) => mod.motion.div),
  { ssr: false },
);

export type Promotion = BasePromotion & {
  actionDisabled?: boolean;
  actionTooltip?: string;
  onAction: () => void;
};

export interface PromotionCardProps {
  promotion: Promotion;
  onClick?: () => void;
}

export default function PromotionCard({
  promotion,
  onClick,
}: PromotionCardProps) {
  const {
    category,
    title,
    description,
    reward,
    unlockText,
    progress,
    statusText,
    actionDisabled = false,
    actionTooltip,
    onAction,
  } = promotion;

  // Badge styling
  const badgeClasses =
    category === 'special'
      ? 'bg-accent-blue text-text-primary'
      : 'bg-accent-yellow text-primary-bg';

  // Progress bar defaults
  const percent = progress
    ? Math.min(
        100,
        Math.max(0, Math.round((progress.current / progress.total) * 100)),
      )
    : 0;
  const barColorClass = progress?.barColorClass || 'bg-accent-green';

  const CardButton = (
    <SmoothButton
      variant={actionDisabled ? 'ghost' : 'primary'}
      className="w-full uppercase"
      disabled={actionDisabled}
      onClick={onAction}
    >
      Claim
    </SmoothButton>
  );

  return (
    <MotionDiv
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={m.base}
      className="bg-card-bg rounded-2xl p-6 flex flex-col justify-between hover:bg-hover-bg motion-safe:transition-transform motion-reduce:!transform-none"
      onClick={onClick}
    >
      <div>
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-bold text-text-primary">{title}</h3>
          <span
            className={`text-xs font-semibold px-2 py-1 rounded ${badgeClasses}`}
          >
            {' '}
            {category.charAt(0).toUpperCase() + category.slice(1)}{' '}
          </span>
        </div>
        <p className="text-text-secondary text-sm mb-2">{description}</p>
        <p className="text-text-secondary text-xs mb-1">
          <FontAwesomeIcon icon={faGift} className="mr-1 text-accent-yellow" />
          Reward: <span className="text-text-primary">{reward}</span>
        </p>
        <p className="text-text-secondary text-xs mb-3">
          <FontAwesomeIcon icon={faKey} className="mr-1 text-accent-yellow" />
          Unlock: <span className="text-text-primary">{unlockText}</span>
        </p>

        {progress && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-text-secondary mb-1">
              <span>Progress</span>
              <span>
                {progress.label || `${progress.current} / ${progress.total}`}
              </span>
            </div>
            <div className="w-full bg-primary-bg rounded-full h-2.5 overflow-hidden">
              <div
                className={`${barColorClass} h-2.5 rounded-full`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        )}

        {statusText && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-text-secondary mb-1">
              <span>Status</span>
              <span className="text-accent-green">{statusText}</span>
            </div>
            <div className="w-full bg-primary-bg rounded-full h-2.5">
              <div
                className="bg-accent-green h-2.5 rounded-full"
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}
      </div>

      {actionDisabled && actionTooltip ? (
        <Tooltip text={actionTooltip}>
          <div>{CardButton}</div>
        </Tooltip>
      ) : (
        CardButton
      )}
    </MotionDiv>
  );
}
