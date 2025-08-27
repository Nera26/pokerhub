// app/wallet/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHourglassHalf } from '@fortawesome/free-solid-svg-icons/faHourglassHalf';
import WalletSummary from '@/app/components/wallet/WalletSummary';
import TransactionHistory, {
  Transaction,
} from '@/app/components/wallet/TransactionHistory';
import Modal from '@/app/components/ui/Modal';
import DepositModalContent from '@/app/components/wallet/DepositModalContent';
import WithdrawModalContent from '@/app/components/wallet/WithdrawModalContent';
import ToastNotification, {
  ToastType,
} from '@/app/components/ui/ToastNotification';

export default function WalletPage() {
  // Balances
  const [realBalance] = useState<number>(1250.0);
  const [creditBalance] = useState<number>(350.0);

  // Pending transactions (static example data)
  const [pendingTransactions] = useState([
    {
      id: 'pending-tx-1',
      type: 'Withdrawal - Crypto (USDT)',
      amount: 100.0,
      status: 'Pending Confirmation',
      date: 'June 15, 2024, 10:30 AM',
    },
    {
      id: 'pending-tx-2',
      type: 'Deposit - QPay',
      amount: 50.0,
      status: 'Processing',
      date: 'June 14, 2024, 02:17 PM',
    },
  ]);

  // Transaction history data
  const transactionHistoryData: Transaction[] = [
    {
      id: 'tx-history-1',
      type: 'Deposit (Credit Card)',
      amount: 200.0,
      date: 'June 12, 2024, 09:15 AM',
      status: 'Completed',
    },
    {
      id: 'tx-history-2',
      type: 'Withdrawal (Crypto)',
      amount: -50.0,
      date: 'June 10, 2024, 03:45 PM',
      status: 'Completed',
    },
    {
      id: 'tx-history-3',
      type: 'Deposit (QPay)',
      amount: 150.0,
      date: 'June 08, 2024, 11:00 AM',
      status: 'Failed',
    },
    {
      id: 'tx-history-4',
      type: 'Game Winnings',
      amount: 75.5,
      date: 'June 07, 2024, 08:22 PM',
      status: 'Completed',
    },
    {
      id: 'tx-history-5',
      type: 'Claimed Bonus',
      amount: 100.0,
      date: 'June 12, 2024, 02:30 PM',
      status: 'Completed',
    },
  ];

  // Modal state
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  // Toast state
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');
  const [isToastOpen, setIsToastOpen] = useState(false);

  // Show toast helper
  const showToast = (message: string, type: ToastType = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setIsToastOpen(true);
  };

  // Deposit handlers
  const openDepositModal = () => setIsDepositModalOpen(true);
  const closeDepositModal = () => setIsDepositModalOpen(false);
  const handleDepositConfirm = () => {
    closeDepositModal();
    showToast('Deposit under review, you’ll be notified soon');
  };

  // Withdraw handlers
  const openWithdrawModal = () => setIsWithdrawModalOpen(true);
  const closeWithdrawModal = () => setIsWithdrawModalOpen(false);
  const handleWithdrawConfirm = (amount: number) => {
    closeWithdrawModal();
    showToast(`Withdraw request of $${amount.toFixed(2)} sent`);
  };

  // Update document title (optional)
  useEffect(() => {
    document.title = 'Wallet – PokerHub';
  }, []);

  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-[calc(env(safe-area-inset-bottom)+72px)] min-h-[calc(100vh-150px)] overflow-x-hidden">
        {/* 1. Balance Overview */}
        <WalletSummary
          realBalance={realBalance}
          creditBalance={creditBalance}
          onDeposit={openDepositModal}
          onWithdraw={openWithdrawModal}
        />

        {/* 2. Pending Transactions */}
        <section id="pending-transactions-section" className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-4">
            Pending Transactions
          </h2>
          <div className="space-y-3">
            {pendingTransactions.length > 0 ? (
              pendingTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-card-bg p-4 rounded-xl flex justify-between items-center hover:bg-hover-bg transition-colors duration-200"
                >
                  <div>
                    <p className="text-text-primary font-medium">{tx.type}</p>
                    <p className="text-text-secondary text-sm">
                      Amount:{' '}
                      <span className="text-accent-yellow">
                        ${tx.amount.toFixed(2)}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-accent-yellow">{tx.status}</p>
                    <p className="text-xs text-text-secondary">{tx.date}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-card-bg p-5 rounded-xl text-center text-text-secondary">
                <FontAwesomeIcon
                  icon={faHourglassHalf}
                  className="text-3xl mb-2 text-accent-yellow"
                />
                <p>No pending transactions at the moment.</p>
              </div>
            )}
          </div>
        </section>

        {/* 3. Transaction History */}
        <TransactionHistory transactions={transactionHistoryData} />
      </div>

      {/* Deposit Modal */}
      <Modal isOpen={isDepositModalOpen} onClose={closeDepositModal}>
        <DepositModalContent
          onClose={closeDepositModal}
          onConfirm={handleDepositConfirm}
        />
      </Modal>

      {/* Withdraw Modal */}
      <Modal isOpen={isWithdrawModalOpen} onClose={closeWithdrawModal}>
        <WithdrawModalContent
          availableBalance={realBalance}
          bankAccountNumber="1234 5678 9101"
          accountTier="Verified"
          accountHolder="PlayerOne23"
          onClose={closeWithdrawModal}
          onConfirm={handleWithdrawConfirm}
        />
      </Modal>

      {/* Toast Notification */}
      <ToastNotification
        message={toastMessage}
        type={toastType}
        isOpen={isToastOpen}
        onClose={() => setIsToastOpen(false)}
      />
    </>
  );
}
