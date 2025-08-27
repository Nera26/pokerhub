'use client';
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe } from '@fortawesome/free-solid-svg-icons/faGlobe';
import { faPencil } from '@fortawesome/free-solid-svg-icons/faPencil';
import Tooltip from '../ui/Tooltip';
import { Button } from '../ui/Button';
import Image from 'next/image';

interface Props {
  userExp: number;
  onEdit(): void;
}

const tiers = [
  { name: 'Bronze', min: 0, max: 999 },
  { name: 'Silver', min: 1000, max: 4999 },
  { name: 'Gold', min: 5000, max: 9999 },
  { name: 'Diamond', min: 10000, max: 19999 },
  { name: 'Platinum', min: 20000, max: Infinity },
];

export default function ProfileSection({ userExp, onEdit }: Props) {
  // figure out current / next tier
  const current = tiers.find((t) => userExp >= t.min && userExp <= t.max)!;
  const nextTier = tiers[tiers.indexOf(current) + 1] || current;
  const pct =
    current.name === 'Platinum'
      ? 100
      : Math.round(
          ((userExp - current.min) / (nextTier.min - current.min)) * 100,
        );

  return (
    <section className="bg-card-bg rounded-2xl p-8 mb-8 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-transform duration-200">
      <div className="flex flex-col md:flex-row md:items-start md:space-x-8">
        {/* Avatar + user info */}
        <div className="flex-shrink-0 relative flex flex-col items-center md:items-start mb-6 md:mb-0">
          <Tooltip text="Click to edit avatar" wrapperProps={{ tabIndex: -1 }}>
            <button
              onClick={onEdit}
              aria-label="Edit avatar"
              className="w-32 h-32 rounded-full border-4 border-accent-yellow shadow-lg cursor-pointer"
            >
              <Image
                src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg"
                alt="User avatar"
                width={128}
                height={128}
                sizes="128px"
                className="w-32 h-32 rounded-full"
              />
            </button>
          </Tooltip>

          <button
            onClick={onEdit}
            className="text-2xl font-bold mt-4 cursor-pointer"
            role="heading"
            aria-level={1}
          >
            PlayerOne23
          </button>
          <p className="text-text-secondary text-sm mt-1">
            playerone23@example.com
          </p>
          <p className="text-text-secondary text-sm mt-1">Bank: •••• 1234</p>
          <p className="text-text-secondary flex items-center mt-1 text-sm">
            <FontAwesomeIcon
              icon={faGlobe}
              className="mr-2 text-accent-yellow"
            />
            United States
          </p>
          <p className="text-text-secondary text-xs mt-1">
            Joined: January 15, 2023
          </p>
          <p className="text-text-secondary text-sm mt-3 max-w-xs text-center md:text-left italic">
            "Texas grinder. Loves Omaha. Weekend warrior."
          </p>

          {/* Tier & EXP bar */}
          <p className="mt-1 flex items-center">
            Tier:
            <span className="inline-block bg-accent-yellow text-primary-bg font-semibold py-1 px-3 rounded-full text-sm ml-2">
              {current.name}
            </span>
          </p>
          <div className="w-full bg-border-dark rounded-full h-3 mt-2 overflow-hidden">
            <div
              className="h-full bg-accent-green"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-text-secondary text-xs mt-1">
            EXP: {userExp.toLocaleString()} /{' '}
            {current.name === 'Platinum'
              ? userExp.toLocaleString()
              : nextTier.min.toLocaleString()}
          </p>
        </div>

        {/* Balance & action buttons */}
        <div className="flex-grow flex flex-col md:items-end space-y-6">
          <button
            type="button"
            className="w-full md:w-auto text-center md:text-right tooltip"
            onClick={onEdit}
          >
            <p className="uppercase text-text-secondary text-sm tracking-wider">
              Current Balance
            </p>
            <p className="text-4xl font-bold text-accent-yellow mt-1">
              $1,250.00
            </p>
            <span className="tooltip-text">View Transaction History</span>
          </button>
          <Button variant="outline" className="cursor-pointer" onClick={onEdit}>
            <FontAwesomeIcon icon={faPencil} className="mr-2" /> Edit Profile
          </Button>
        </div>
      </div>
    </section>
  );
}
