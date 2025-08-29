// app/wallet/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { getStatus, fetchTransactions, fetchPending } from '@/lib/api/wallet';
import { useQuery } from '@tanstack/react-query';

export default function WalletPage() {
  // Balances
  const [realBalance] = useState<number>(1250.0);
  const [creditBalance] = useState<number>(350.0);
  const [kycVerified, setKycVerified] = useState(false);

  const {
    data: pendingData,
    isLoading: pendingLoading,
    error: pendingError,
  } = useQuery({
    queryKey: ['wallet', 'pending'],
    queryFn: ({ signal }) => fetchPending({ signal }),
  });

  const pendingTransactions = useMemo(
    () =>
      (pendingData ?? []).map((tx) => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        status: tx.status,
        date: new Date(tx.createdAt).toLocaleString(),
      })),
    [pendingData],
  );

  const {
    data: historyData,
    isLoading: historyLoading,
    error: historyError,
  } = useQuery({
    queryKey: ['wallet', 'transactions'],
    queryFn: ({ signal }) => fetchTransactions({ signal }),
  });

  const transactionHistoryData: Transaction[] = useMemo(
    () =>
      (historyData ?? []).map((tx) => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        date: new Date(tx.createdAt).toLocaleString(),
        status: tx.status,
      })),
    [historyData],
  );

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
      getStatus()
        .then((res) => setKycVerified(res.kycVerified))
        .catch(() => setKycVerified(false));
  }, []);

  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-[calc(env(safe-area-inset-bottom)+72px)] min-h-[calc(100vh-150px)] overflow-x-hidden">
        {/* 1. Balance Overview */}
        <WalletSummary
          realBalance={realBalance}
          creditBalance={creditBalance}
          kycVerified={kycVerified}
          onDeposit={openDepositModal}
          onWithdraw={openWithdrawModal}
        />

        {/* 2. Pending Transactions */}
        <section id="pending-transactions-section" className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-4">
            Pending Transactions
          </h2>
          <div className="space-y-3">
            {pendingLoading ? (
              <div className="bg-card-bg p-5 rounded-xl text-center text-text-secondary">
                Loading...
              </div>
            ) : pendingError ? (
              <div className="bg-card-bg p-5 rounded-xl text-center text-danger-red">
                Failed to load pending transactions
              </div>
            ) : pendingTransactions.length > 0 ? (
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
        {historyLoading ? (
          <div className="p-5 text-center text-text-secondary">Loading...</div>
        ) : historyError ? (
          <div className="p-5 text-center text-danger-red">
            Failed to load transactions
          </div>
        ) : (
          <TransactionHistory transactions={transactionHistoryData} />
        )}
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
