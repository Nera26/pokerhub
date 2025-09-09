'use client';

import { useMemo, useRef, useState } from 'react';
import useVirtualizedList from '@/hooks/useVirtualizedList';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUniversity,
  faSpinner,
  faImage,
  faComment,
} from '@fortawesome/free-solid-svg-icons';
import { TransactionTab } from './types';

import Modal from '../ui/Modal';
import ToastNotification from '../ui/ToastNotification';
import ManageBalanceModal from '../modals/ManageBalanceModal';
import RejectionModal from '../modals/RejectionModal';
import IBANManagerModal from '../modals/IBANManagerModal';
import RequestTable from './transactions/RequestTable';
import TransactionHistory from './transactions/TransactionHistory';
import type { DepositReq, WithdrawalReq, Txn } from './transactions/types';
import { useApiError } from '@/hooks/useApiError';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPendingDeposits,
  confirmDeposit,
  rejectDeposit,
  fetchPendingWithdrawals,
  confirmWithdrawal,
  rejectWithdrawal,
  fetchBalances,
  fetchTransactionsLog,
  fetchTransactionTabs,
  fetchTransactionTypes,
  adminAdjustBalance,
} from '@/lib/api/wallet';
import {
  useIban,
  useIbanHistory,
  useWalletReconcileMismatches,
} from '@/hooks/wallet';
import type { IbanHistoryEntry } from '@shared/wallet.schema';
import { exportCsv } from '@/lib/exportCsv';
/* -------------------------------- Types -------------------------------- */
type UserStatus = 'Active' | 'Frozen' | 'Banned';

type BalanceRow = {
  user: string;
  avatar: string;
  balance: number;
  status: UserStatus;
  lastActivity: string;
};

/* -------------------------------- Modals -------------------------------- */
function ReceiptModal({
  open,
  onClose,
  url,
}: {
  open: boolean;
  onClose: () => void;
  url?: string;
}) {
  return (
    <Modal isOpen={open} onClose={onClose}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Receipt</h3>
        <button
          onClick={onClose}
          className="text-text-secondary hover:text-text-primary"
          aria-label="Close receipt"
        >
          ✕
        </button>
      </div>
      <div className="bg-primary-bg p-4 rounded-2xl">
        <Image
          src={
            url || 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
          }
          alt="Receipt"
          width={640}
          height={400}
          className="w-full max-h-[70vh] object-contain rounded-xl"
        />
      </div>
    </Modal>
  );
}

/* ------------------------------- Main Page ------------------------------ */
export default function BalanceTransactions() {
  const [tab, setTab] = useState<TransactionTab>('all');
  const {
    data: filters = [],
    isLoading: tabsLoading,
    error: tabsError,
  } = useQuery({
    queryKey: ['transaction-tabs'],
    queryFn: fetchTransactionTabs,
  });
  const tabsErrorMessage = useApiError(tabsError);

  const queryClient = useQueryClient();
  const {
    data: deposits = [],
    isLoading: depositsLoading,
    error: depositsError,
  } = useQuery<DepositReq[]>({
    queryKey: ['deposits'],
    queryFn: async () => {
      const res = await fetchPendingDeposits();
      return res.deposits.map((d) => ({
        id: d.id,
        user: d.userId,
        avatar: d.avatar,
        amount: d.amount,
        method: d.method,
        date: d.createdAt,
        receiptUrl: undefined,
        status:
          d.status === 'pending'
            ? 'Pending'
            : d.status === 'confirmed'
              ? 'Completed'
              : 'Rejected',
      }));
    },
    staleTime: 30000,
  });
  const depositsErrorMessage = useApiError(depositsError);

  const {
    data: withdrawals = [],
    isLoading: withdrawalsLoading,
    error: withdrawalsError,
  } = useQuery<WithdrawalReq[]>({
    queryKey: ['withdrawals'],
    queryFn: async () => {
      const res = await fetchPendingWithdrawals();
      return res.withdrawals.map((w) => ({
        id: w.id,
        user: w.userId,
        avatar: w.avatar,
        amount: w.amount,
        bank: w.bank,
        maskedAccount: w.maskedAccount,
        date: w.createdAt,
        comment: '',
        status:
          w.status === 'pending'
            ? 'Pending'
            : w.status === 'completed'
              ? 'Completed'
              : 'Rejected',
      }));
    },
    staleTime: 30000,
  });
  const withdrawalsErrorMessage = useApiError(withdrawalsError);

  const {
    data: balances = [],
    isLoading: balancesLoading,
    error: usersError,
  } = useQuery<BalanceRow[]>({
    queryKey: ['balances'],
    queryFn: fetchBalances,
    staleTime: 30000,
  });
  const usersErrorMessage = useApiError(usersError);

  const {
    data: mismatchData,
    isLoading: mismatchLoading,
    error: mismatchError,
  } = useWalletReconcileMismatches();
  const mismatches = mismatchData?.mismatches ?? [];
  const mismatchErrorMessage = useApiError(mismatchError);

  const sortedBalances = useMemo(
    () => [...balances].sort((a, b) => a.user.localeCompare(b.user)),
    [balances],
  );
  const balancesParentRef = useRef<HTMLDivElement>(null);
  // Virtualize balance rows for performance; tests rely on data-index attributes
  const balancesVirtualizer = useVirtualizedList<HTMLDivElement>({
    count: sortedBalances.length,
    parentRef: balancesParentRef,
    estimateSize: 60,
  });

  const [playerFilter, setPlayerFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const {
    data: txnTypes = [],
    isLoading: txnTypesLoading,
    error: txnTypesError,
  } = useQuery({
    queryKey: ['transactionTypes'],
    queryFn: fetchTransactionTypes,
  });
  useApiError(txnTypesError);

  const {
    data: log = [],
    isLoading: logLoading,
    error: logError,
  } = useQuery<Txn[]>({
    queryKey: ['transactions', playerFilter, typeFilter],
    queryFn: ({ signal }) =>
      fetchTransactionsLog({
        signal,
        playerId: playerFilter || undefined,
        type: typeFilter || undefined,
      }),
    staleTime: 30000,
  });
  const logErrorMessage = useApiError(logError);

  // IBAN manager
  const [ibanMasked, setIbanMasked] = useState(true);
  const { data: ibanData } = useIban();
  const ibanFull = ibanData?.iban ?? '';
  const ibanMaskDisplay = ibanData?.masked ?? '';
  const ibanHolder = ibanData?.holder ?? '';
  const ibanInstructions = ibanData?.instructions ?? '';
  const ibanUpdatedBy = ibanData?.updatedBy ?? '';
  const ibanUpdatedAt = ibanData?.updatedAt ?? '';
  const { data: ibanHistoryData } = useIbanHistory();
  const ibanHistory: IbanHistoryEntry[] = ibanHistoryData?.history ?? [];

  // UI state
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'loading'>(
    'success',
  );
  const notify = (
    m: string,
    t: 'success' | 'error' | 'loading' = 'success',
  ) => {
    setToastMsg(m);
    setToastType(t);
    setToastOpen(true);
  };

  const [rejectOpen, setRejectOpen] = useState(false);
  const rejectPayload = useRef<{
    kind: 'deposit' | 'withdrawal';
    id: string;
  } | null>(null);

  const [receiptUrl, setReceiptUrl] = useState<string | undefined>();
  const [receiptOpen, setReceiptOpen] = useState(false);

  const [ibanOpen, setIbanOpen] = useState(false);

  // manage-balance modal
  const [mbOpen, setMbOpen] = useState(false);
  const [mbUser, setMbUser] = useState<BalanceRow | null>(null);

  /* -------------------------------- Actions ------------------------------- */
  const confirmDepositMutation = useMutation({
    mutationFn: (id: string) => confirmDeposit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      notify('Deposit approved successfully');
    },
    onError: (e: any) =>
      notify(e?.message || 'Failed to approve deposit', 'error'),
  });

  const rejectDepositMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      rejectDeposit(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      notify('Request rejected successfully');
    },
    onError: (e: any) =>
      notify(e?.message || 'Failed to reject request', 'error'),
  });

  const confirmWithdrawalMutation = useMutation({
    mutationFn: (id: string) => confirmWithdrawal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
      notify('Withdrawal approved successfully');
    },
    onError: (e: any) =>
      notify(e?.message || 'Failed to approve withdrawal', 'error'),
  });

  const rejectWithdrawalMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectWithdrawal(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
      notify('Request rejected successfully');
    },
    onError: (e: any) =>
      notify(e?.message || 'Failed to reject request', 'error'),
  });

  const approveDeposit = (id: string) => {
    if (
      !confirm(
        "Approve this deposit? This will add funds to the user's balance.",
      )
    )
      return;
    confirmDepositMutation.mutate(id);
  };

  const rejectDeposit = (id: string) => {
    rejectPayload.current = { kind: 'deposit', id };
    setRejectOpen(true);
  };

  const approveWithdrawal = (id: string) => {
    if (
      !confirm(
        "Approve this withdrawal? This will deduct funds from the user's balance.",
      )
    )
      return;
    confirmWithdrawalMutation.mutate(id);
  };

  const rejectWithdrawal = (id: string) => {
    rejectPayload.current = { kind: 'withdrawal', id };
    setRejectOpen(true);
  };

  const confirmRejection = (reason: string) => {
    const payload = rejectPayload.current;
    if (!payload) return;
    if (payload.kind === 'deposit') {
      rejectDepositMutation.mutate({ id: payload.id, reason });
    } else {
      rejectWithdrawalMutation.mutate({ id: payload.id, reason });
    }
    setRejectOpen(false);
    rejectPayload.current = null;
  };

  const addComment = (id: string) => {
    const msg = prompt('Add a comment:');
    if (!msg) return;
    queryClient.setQueryData<Txn[]>(['transactions'], (l = []) => [
      {
        datetime: new Date().toISOString().slice(0, 16).replace('T', ' '),
        action: 'Comment',
        amount: 0,
        by: 'Admin_You',
        notes: `#${id} ${msg}`,
        status: 'Completed',
      },
      ...(l ?? []),
    ]);
    notify('Comment added');
  };

  const openReceipt = (url?: string) => {
    setReceiptUrl(url);
    setReceiptOpen(true);
  };

  const openManageBalance = (row: BalanceRow) => {
    setMbUser(row);
    setMbOpen(true);
  };

  const manageBalanceMutation = useMutation({
    mutationFn: ({
      userId,
      amount,
      action,
      notes,
    }: {
      userId: string;
      amount: number;
      action: 'add' | 'remove' | 'freeze';
      notes: string;
    }) =>
      adminAdjustBalance(userId, {
        action,
        amount,
        currency: 'USD',
        notes,
      }),
    onMutate: () => notify('Updating balance...', 'loading'),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      notify(vars.action === 'freeze' ? 'Funds frozen' : 'Balance updated');
    },
    onError: (e: any) =>
      notify(e?.message || 'Failed to update balance', 'error'),
  });

  const onManageBalance = (
    amount: number,
    action: 'add' | 'remove' | 'freeze',
    notes: string,
  ) => {
    if (!mbUser) return;
    if (!notes.trim()) {
      notify('Please provide notes', 'error');
      return;
    }
    manageBalanceMutation.mutate({
      userId: mbUser.user,
      amount,
      action,
      notes,
    });
  };

  const exportCSV = () => {
    const header = [
      'Date & Time',
      'Action',
      'Amount',
      'Performed By',
      'Notes',
      'Status',
    ];
    const rows = log.map((t) => [
      t.datetime,
      t.action,
      (t.amount >= 0 ? '+' : '') + t.amount,
      t.by,
      `"${t.notes.replace(/"/g, '""')}"`,
      t.status,
    ]);
    exportCsv('transaction_log.csv', header, rows);
    notify('CSV export started');
  };

  const updateIBAN = (_newIban: string, _newHolder: string, _notes: string) => {
    notify('IBAN updated successfully');
  };

  const reuseIBAN = (iban: string) => {
    alert(`Loaded IBAN for reuse:\n${iban}`);
  };

  /* --------------------------------- UI --------------------------------- */
  return (
    <div className="space-y-8">
      {/* Filters */}
      <section className="mb-2">
        <div className="flex gap-3">
          {tabsLoading ? (
            <FontAwesomeIcon icon={faSpinner} spin aria-label="loading tabs" />
          ) : tabsError ? (
            <p role="alert">{tabsErrorMessage || 'Failed to load tabs.'}</p>
          ) : (
            filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setTab(f.id)}
                className={
                  'px-4 py-2 rounded-2xl font-semibold transition ' +
                  (tab === f.id
                    ? 'bg-accent-yellow text-black'
                    : 'bg-hover-bg text-text-primary hover:bg-accent-green hover:text-white')
                }
              >
                {f.label}
              </button>
            ))
          )}
        </div>
      </section>
      {depositsLoading ? (
        <div className="flex justify-center" aria-label="loading deposits">
          <FontAwesomeIcon icon={faSpinner} spin />
        </div>
      ) : depositsError ? (
        <p role="alert">{depositsErrorMessage || 'Failed to load deposits.'}</p>
      ) : deposits.length === 0 ? (
        <p>No pending deposits.</p>
      ) : (
        <RequestTable
          title="Deposit Requests"
          rows={deposits}
          columns={[
            {
              label: 'Player',
              render: (d) => (
                <div className="flex items-center gap-2">
                  <Image
                    src={d.avatar}
                    alt={d.user}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full"
                  />
                  <span>{d.user}</span>
                </div>
              ),
            },
            {
              label: 'Amount',
              render: (d) => (
                <span className="font-semibold text-accent-green">
                  ${d.amount}
                </span>
              ),
            },
            { label: 'Method', render: (d) => d.method },
            {
              label: 'Date',
              render: (d) => (
                <span className="text-text-secondary">{d.date}</span>
              ),
            },
            {
              label: 'Receipt',
              render: (d) => (
                <button
                  onClick={() => openReceipt(d.receiptUrl)}
                  className="text-accent-blue hover:brightness-110"
                  title="View Receipt"
                  aria-label="View receipt"
                >
                  <FontAwesomeIcon icon={faImage} />
                </button>
              ),
            },
          ]}
          actions={[
            {
              label: 'Approve',
              onClick: (d) => approveDeposit(d.id),
              className:
                'bg-accent-green hover:brightness-110 px-2 py-1 rounded text-xs font-semibold',
            },
            {
              label: 'Reject',
              onClick: (d) => rejectDeposit(d.id),
              className:
                'bg-danger-red hover:bg-red-600 px-2 py-1 rounded text-xs font-semibold',
            },
            {
              icon: faComment,
              onClick: (d) => addComment(d.id),
              className:
                'bg-accent-blue hover:brightness-110 px-2 py-1 rounded text-xs',
              title: 'Add Comment',
              ariaLabel: 'Add comment',
            },
          ]}
        />
      )}
      {withdrawalsLoading ? (
        <div className="flex justify-center" aria-label="loading withdrawals">
          <FontAwesomeIcon icon={faSpinner} spin />
        </div>
      ) : withdrawalsError ? (
        <p role="alert">
          {withdrawalsErrorMessage || 'Failed to load withdrawals.'}
        </p>
      ) : withdrawals.length === 0 ? (
        <p>No pending withdrawals.</p>
      ) : (
        <RequestTable
          title="Withdrawal Requests"
          rows={withdrawals}
          columns={[
            {
              label: 'Player',
              render: (w) => (
                <div className="flex items-center gap-2">
                  <Image
                    src={w.avatar}
                    alt={w.user}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full"
                  />
                  <span>{w.user}</span>
                </div>
              ),
            },
            {
              label: 'Amount',
              render: (w) => (
                <span className="font-semibold text-danger-red">
                  ${w.amount}
                </span>
              ),
            },
            {
              label: 'Bank Info',
              render: (w) => (
                <div className="text-xs">
                  <div>{w.bank}</div>
                  <div className="text-text-secondary">{w.maskedAccount}</div>
                </div>
              ),
            },
            {
              label: 'Date',
              render: (w) => (
                <span className="text-text-secondary">{w.date}</span>
              ),
            },
            {
              label: 'Comment',
              render: (w) => (
                <span className="text-text-secondary">{w.comment}</span>
              ),
            },
          ]}
          actions={[
            {
              label: 'Approve',
              onClick: (w) => approveWithdrawal(w.id),
              className:
                'bg-accent-green hover:brightness-110 px-2 py-1 rounded text-xs font-semibold',
            },
            {
              label: 'Reject',
              onClick: (w) => rejectWithdrawal(w.id),
              className:
                'bg-danger-red hover:bg-red-600 px-2 py-1 rounded text-xs font-semibold',
            },
          ]}
        />
      )}
      {/* User Balance Management */}
      {balancesLoading ? (
        <div className="flex justify-center" aria-label="loading balances">
          <FontAwesomeIcon icon={faSpinner} spin />
        </div>
      ) : usersError ? (
        <p role="alert">{usersErrorMessage || 'Failed to load users.'}</p>
      ) : balances.length === 0 ? (
        <p>No user balances.</p>
      ) : (
        <section>
          <div className="bg-card-bg p-6 rounded-2xl card-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">User Balance Management</h3>
              <button
                onClick={() => setIbanOpen(true)}
                className="bg-accent-blue hover:brightness-110 px-4 py-2 rounded-2xl font-semibold text-sm"
              >
                <FontAwesomeIcon icon={faUniversity} className="mr-2" />
                Manage IBAN
              </button>
            </div>
            <div ref={balancesParentRef} className="overflow-auto max-h-80">
              <table className="min-w-max w-full text-sm">
                <thead>
                  <tr className="border-b border-dark">
                    <th className="text-left py-3 px-2 text-text-secondary">
                      Player
                    </th>
                    <th className="text-left py-3 px-2 text-text-secondary">
                      Current Balance
                    </th>
                    <th className="text-left py-3 px-2 text-text-secondary">
                      Status
                    </th>
                    <th className="text-left py-3 px-2 text-text-secondary">
                      Last Activity
                    </th>
                    <th className="text-left py-3 px-2 text-text-secondary">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody
                  style={
                    balancesLoading
                      ? undefined
                      : {
                          height: `${balancesVirtualizer.getTotalSize()}px`,
                          position: 'relative',
                        }
                  }
                >
                  {balancesLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b border-dark">
                          <td colSpan={5} className="py-3 px-2">
                            <div className="h-6 bg-hover-bg rounded animate-pulse" />
                          </td>
                        </tr>
                      ))
                    : balancesVirtualizer
                        .getVirtualItems()
                        .map((virtualRow) => {
                          const b = sortedBalances[virtualRow.index];
                          return (
                            <tr
                              key={b.user}
                              ref={balancesVirtualizer.measureElement}
                              data-index={virtualRow.index}
                              className="border-b border-dark hover:bg-hover-bg"
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                transform: `translateY(${virtualRow.start}px)`,
                              }}
                            >
                              <td className="py-3 px-2">
                                <div className="flex items-center gap-2">
                                  <Image
                                    src={b.avatar}
                                    alt={b.user}
                                    width={32}
                                    height={32}
                                    className="w-8 h-8 rounded-full"
                                  />
                                  <span>{b.user}</span>
                                </div>
                              </td>
                              <td className="py-3 px-2 font-semibold text-accent-green">
                                ${b.balance.toLocaleString()}
                              </td>
                              <td className="py-3 px-2">
                                <span className="bg-accent-green text-white px-2 py-1 rounded-lg text-xs">
                                  {b.status}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-text-secondary">
                                {b.lastActivity}
                              </td>
                              <td className="py-3 px-2">
                                <button
                                  onClick={() => openManageBalance(b)}
                                  className="bg-accent-yellow hover:brightness-110 text-black px-3 py-1 rounded text-xs font-semibold"
                                >
                                  Manage Balance
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
      <section>
        {mismatchLoading ? (
          <div className="flex justify-center" aria-label="loading mismatches">
            <FontAwesomeIcon icon={faSpinner} spin />
          </div>
        ) : mismatchError ? (
          <p role="alert">
            {mismatchErrorMessage || 'Failed to load mismatches.'}
          </p>
        ) : mismatches.length === 0 ? (
          <p>No mismatches.</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-dark">
                <th className="py-2 px-2">Date</th>
                <th className="py-2 px-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {mismatches.map((m) => (
                <tr key={m.date} className="border-b border-dark">
                  <td className="py-2 px-2 text-text-secondary">{m.date}</td>
                  <td className="py-2 px-2 font-semibold">${m.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      {logLoading ? (
        <div className="flex justify-center" aria-label="loading history">
          <FontAwesomeIcon icon={faSpinner} spin />
        </div>
      ) : logError ? (
        <p role="alert">
          {logErrorMessage || 'Failed to load transaction history.'}
        </p>
      ) : (
        <TransactionHistory onExport={exportCSV} />
      )}
      /* Modals */
      <RejectionModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={confirmRejection}
      />
      <ReceiptModal
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        url={receiptUrl}
      />
      <ManageBalanceModal
        isOpen={mbOpen}
        onClose={() => setMbOpen(false)}
        userName={mbUser?.user || ''}
        currentBalance={mbUser?.balance || 0}
        onSubmit={onManageBalance}
      />
      <IBANManagerModal
        open={ibanOpen}
        onClose={() => setIbanOpen(false)}
        currentIbanMasked={ibanMaskDisplay}
        currentIbanFull={ibanFull}
        masked={ibanMasked}
        holder={ibanHolder}
        instructions={ibanInstructions}
        lastUpdatedBy={ibanUpdatedBy}
        lastUpdatedAt={ibanUpdatedAt}
        onToggleMask={() => setIbanMasked((v) => !v)}
        onUpdate={updateIBAN}
        history={ibanHistory}
        onReuse={reuseIBAN}
      />
      {/* Toast */}
      <ToastNotification
        isOpen={toastOpen}
        message={toastMsg}
        type={toastType}
        onClose={() => setToastOpen(false)}
      />
    </div>
  );
}
