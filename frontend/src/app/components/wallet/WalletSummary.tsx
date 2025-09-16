'use client';

import Tooltip from '../ui/Tooltip';
import Button from '../ui/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowDown } from '@fortawesome/free-solid-svg-icons/faArrowDown';
import { faArrowUp } from '@fortawesome/free-solid-svg-icons/faArrowUp';

interface WalletSummaryProps {
  /** User's real (withdrawable) balance */
  realBalance: number;
  /** User's credit balance (in-game only) */
  creditBalance: number;
  /** Whether the user has passed KYC verification */
  kycVerified: boolean;
  /** Called when user clicks Verify KYC */
  onVerify?: () => void;
  /** Called when user clicks Deposit */
  onDeposit: () => void;
  /** Called when user clicks Withdraw */
  onWithdraw: () => void;
  /** Currency code for displaying amounts */
  currency: string;
}

export default function WalletSummary({
  realBalance,
  creditBalance,
  kycVerified,
  onDeposit,
  onWithdraw,
  onVerify,
  currency,
}: WalletSummaryProps) {
  const totalBalance = realBalance + creditBalance;
  const format = (value: number) =>
    new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  return (
    <section className="bg-card-bg rounded-2xl p-8 md:p-12 mb-6 md:mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <p className="text-text-secondary text-sm sm:text-base">
            Total Balance
          </p>
          <p className="text-3xl sm:text-4xl font-bold text-accent-yellow mb-1">
            {format(totalBalance)}
          </p>
          <p className="text-xs text-text-secondary mb-2">
            KYC Status: {kycVerified ? 'Verified' : 'Pending'}
          </p>
          <p className="text-sm sm:text-base text-text-secondary">
            <span className="font-medium">• Real: {format(realBalance)}</span>
            &nbsp;|&nbsp;
            <Tooltip text="Credits can only be used for games and cannot be withdrawn.">
              <span className="font-medium">
                • Credit: {format(creditBalance)}
              </span>
            </Tooltip>
          </p>
        </div>

        <div className="mt-6 md:mt-0 flex space-x-4">
          {!kycVerified && onVerify && (
            <Button
              variant="outline"
              onClick={onVerify}
              className="text-sm sm:text-base uppercase flex items-center"
            >
              Verify
            </Button>
          )}
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
