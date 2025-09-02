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
import {
  getStatus,
  fetchTransactions,
  fetchPending,
  deposit,
  withdraw,
} from '@/lib/api/wallet';
import { startKyc } from '@/lib/api/kyc';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';

export default function WalletPage() {
  const { realBalance, creditBalance, playerId, setBalances } = useAuth();
  const [kycVerified, setKycVerified] = useState(false);

  const {
    data: pendingData,
    isLoading: pendingLoading,
    error: pendingError,
  } = useQuery({
    queryKey: ['wallet', playerId, 'pending'],
    queryFn: ({ signal }) => fetchPending(playerId, { signal }),
  });

  const pendingTransactions = useMemo(
    () =>
      (pendingData?.transactions ?? []).map((tx) => ({
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
    queryKey: ['wallet', playerId, 'transactions'],
    queryFn: ({ signal }) => fetchTransactions(playerId, { signal }),
  });

  const transactionHistoryData: Transaction[] = useMemo(
    () =>
      (historyData?.transactions ?? []).map((tx) => ({
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
  interface WalletPayload {
    amount: number;
    deviceId: string;
    currency: string;
  }

  const handleDepositConfirm = async ({
    amount,
    deviceId,
    currency,
  }: WalletPayload) => {
    closeDepositModal();
    try {
      const res = await deposit(playerId, amount, deviceId, currency);
      setBalances(res.realBalance, res.creditBalance);
      showToast('Deposit under review, you’ll be notified soon');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Deposit failed';
      showToast(message, 'error');
    }
  };

  // Withdraw handlers
  const openWithdrawModal = () => setIsWithdrawModalOpen(true);
  const closeWithdrawModal = () => setIsWithdrawModalOpen(false);
  const handleWithdrawConfirm = async ({
    amount,
    deviceId,
    currency,
  }: WalletPayload) => {
    closeWithdrawModal();
    try {
      const res = await withdraw(playerId, amount, deviceId, currency);
      setBalances(res.realBalance, res.creditBalance);
      showToast(`Withdraw request of $${amount.toFixed(2)} sent`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Withdraw failed';
      showToast(message, 'error');
    }
  };

  const handleVerify = () => {
    startKyc(playerId)
      .then(() => setKycVerified(true))
      .catch(() => setKycVerified(false));
  };

  // Title & KYC fetch
  useEffect(() => {
    document.title = 'Wallet – PokerHub';
    getStatus(playerId)
      .then((res) => {
        setKycVerified(res.kycVerified);
        setBalances(res.realBalance, res.creditBalance);
      })
      .catch(() => setKycVerified(false));
  }, [playerId, setBalances]);

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
          onVerify={handleVerify}
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
