'use client';

import React from 'react';
import Tooltip from '../ui/Tooltip';
import Button from '../ui/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowDown } from '@fortawesome/free-solid-svg-icons/faArrowDown';
import { faArrowUp } from '@fortawesome/free-solid-svg-icons/faArrowUp';

export interface WalletSummaryProps {
  /** User's real (withdrawable) balance */
  realBalance: number;
  /** User's credit balance (in-game only) */
  creditBalance: number;
  /** Whether the user has passed KYC verification */
  kycVerified: boolean;
  /** Called when user clicks Deposit */
  onDeposit: () => void;
  /** Called when user clicks Withdraw */
  onWithdraw: () => void;
}

export default function WalletSummary({
  realBalance,
  creditBalance,
  kycVerified,
  onDeposit,
  onWithdraw,
}: WalletSummaryProps) {
  const totalBalance = realBalance + creditBalance;

  return (
    <section className="bg-card-bg rounded-2xl p-8 md:p-12 mb-6 md:mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <p className="text-text-secondary text-sm sm:text-base">Total Balance</p>
          <p className="text-3xl sm:text-4xl font-bold text-accent-yellow mb-1">
            ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-text-secondary mb-2">
            KYC Status: {kycVerified ? 'Verified' : 'Pending'}
          </p>
          <p className="text-sm sm:text-base text-text-secondary">
            <span className="font-medium">• Real: ${realBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            &nbsp;|&nbsp;
            <Tooltip text="Credits can only be used for games and cannot be withdrawn.">
              <span className="font-medium">• Credit: ${creditBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </Tooltip>
          </p>
        </div>

        <div className="mt-6 md:mt-0 flex space-x-4">
          <Button
            variant="primary"
            onClick={onDeposit}
            className="text-sm sm:text-base uppercase flex items-center"
          >
            <FontAwesomeIcon icon={faArrowDown} className="mr-2" /> Deposit
          </Button>
          <Button
            variant="outline"
            onClick={onWithdraw}
            className="text-sm sm:text-base uppercase flex items-center"
          >
            <FontAwesomeIcon icon={faArrowUp} className="mr-2" /> Withdraw
          </Button>
        </div>
      </div>
    </section>
  );
}
