'use client';

import { useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUniversity, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { TransactionTab } from './types';

import Modal from '../ui/Modal';
import ToastNotification from '../ui/ToastNotification';
import ManageBalanceModal from '../modals/ManageBalanceModal';
import RejectionModal from '../modals/RejectionModal';
import IBANManagerModal from '../modals/IBANManagerModal';
import DepositTable from './transactions/DepositTable';
import WithdrawalTable from './transactions/WithdrawalTable';
import TransactionHistory from './transactions/TransactionHistory';
import type { DepositReq, WithdrawalReq, Txn } from './transactions/types';
import useRenderCount from '@/hooks/useRenderCount';
import { useApiError } from '@/hooks/useApiError';
import { useQuery, useQueryClient } from '@tanstack/react-query';
/* -------------------------------- Types -------------------------------- */
type UserStatus = 'Active' | 'Frozen' | 'Banned';

type BalanceRow = {
  user: string;
  avatar: string;
  balance: number;
  status: UserStatus;
  lastActivity: string;
};

type IbanHistory = {
  date: string;
  oldIban: string;
  newIban: string;
  by: string;
  notes: string;
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
  useRenderCount('BalanceTransactions');
  const [tab, setTab] = useState<TransactionTab>('all');

  const filters: { id: TransactionTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'deposits', label: 'Deposits' },
    { id: 'withdrawals', label: 'Withdrawals' },
    { id: 'manual', label: 'Manual Adjustments' },
  ];

  const queryClient = useQueryClient();
  const {
    data: deposits = [],
    isLoading: depositsLoading,
    error: depositsError,
  } = useQuery<DepositReq[]>({
    queryKey: ['deposits'],
    queryFn: async () => [
      {
        id: 'dep-001',
        user: 'Mike_P',
        avatar:
          'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg',
        amount: 500,
        method: 'Bank Transfer',
        date: '2024-01-15 14:30',
        receiptUrl:
          'https://images.unsplash.com/photo-1517502884422-41eaead166d4?q=80&w=1200&auto=format&fit=crop',
        status: 'Pending',
      },
      {
        id: 'dep-002',
        user: 'Sarah_K',
        avatar:
          'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg',
        amount: 250,
        method: 'Crypto',
        date: '2024-01-15 12:15',
        receiptUrl:
          'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1200&auto=format&fit=crop',
        status: 'Completed',
      },
    ],
    staleTime: 30000,
  });
  const depositsErrorMessage = useApiError(depositsError);

  const {
    data: withdrawals = [],
    isLoading: withdrawalsLoading,
    error: withdrawalsError,
  } = useQuery<WithdrawalReq[]>({
    queryKey: ['withdrawalRequests'],
    queryFn: async () => [
      {
        id: 'with-001',
        user: 'Alex_R',
        avatar:
          'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg',
        amount: 750,
        bank: 'Chase Bank',
        masked: '****1234',
        date: '2024-01-15 16:45',
        comment: 'Winnings withdrawal',
        status: 'Pending',
      },
      {
        id: 'with-002',
        user: 'John_D',
        avatar:
          'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg',
        amount: 300,
        bank: 'Wells Fargo',
        masked: '****5678',
        date: '2024-01-14 20:30',
        comment: 'Tournament prize',
        status: 'Completed',
      },
    ],
    staleTime: 30000,
  });
  const withdrawalsErrorMessage = useApiError(withdrawalsError);

  const {
    data: balances = [],
    isLoading: balancesLoading,
    error: usersError,
  } = useQuery<BalanceRow[]>({
    queryKey: ['balances'],
    queryFn: async () => [
      {
        user: 'Mike_P',
        avatar:
          'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg',
        balance: 2847,
        status: 'Active',
        lastActivity: '2024-01-15 18:30',
      },
      {
        user: 'Sarah_K',
        avatar:
          'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg',
        balance: 1420,
        status: 'Active',
        lastActivity: '2024-01-15 17:15',
      },
    ],
    staleTime: 30000,
  });
  const usersErrorMessage = useApiError(usersError);

  const sortedBalances = useMemo(
    () => [...balances].sort((a, b) => a.user.localeCompare(b.user)),
    [balances],
  );
  const balancesParentRef = useRef<HTMLDivElement>(null);
  // Virtualize balance rows for performance; tests rely on data-index attributes
  const balancesVirtualizer = useVirtualizer({
    count: sortedBalances.length,
    getScrollElement: () => balancesParentRef.current,
    estimateSize: () => 60,
    initialRect: { width: 0, height: 400 },
  });

  const {
    data: log = [],
    isLoading: logLoading,
    error: logError,
  } = useQuery<Txn[]>({
    queryKey: ['transactions'],
    queryFn: async () => [
      {
        datetime: '2024-01-15 18:45',
        action: 'Deposit Approved',
        amount: +500,
        by: 'Admin_John',
        notes: 'Bank transfer verification completed',
        status: 'Completed',
      },
      {
        datetime: '2024-01-15 16:30',
        action: 'Manual Add',
        amount: +100,
        by: 'Admin_Sarah',
        notes: 'Welcome bonus compensation',
        status: 'Completed',
      },
      {
        datetime: '2024-01-15 14:15',
        action: 'Withdrawal Rejected',
        amount: -750,
        by: 'Admin_Mike',
        notes: 'Insufficient verification documents',
        status: 'Rejected',
      },
    ],
    staleTime: 30000,
  });
  const logErrorMessage = useApiError(logError);

  // IBAN manager
  const [ibanMasked, setIbanMasked] = useState(true);
  const [ibanFull, setIbanFull] = useState('DE02 5001 0517 5407 4100 72');
  const ibanMaskDisplay = 'DE02 5001 **** **** 1234';
  const [ibanHolder, setIbanHolder] = useState('PokerPro Gaming Ltd.');
  const [ibanInstructions, setIbanInstructions] = useState(
    'Transfer within 15 minutes and upload receipt immediately',
  );
  const [ibanHistory, setIbanHistory] = useState<IbanHistory[]>([
    {
      date: '2024-01-15 14:30',
      oldIban: 'DE02 ****1234',
      newIban: 'DE02 ****5678',
      by: 'Admin_John',
      notes: 'Bank maintenance update',
    },
    {
      date: '2024-01-14 09:15',
      oldIban: 'DE02 ****9876',
      newIban: 'DE02 ****1234',
      by: 'Admin_Sarah',
      notes: 'Crypto bank cap limit reached',
    },
  ]);

  // UI state
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const notify = (m: string, t: 'success' | 'error' = 'success') => {
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
  const approveDeposit = (id: string) => {
    if (
      !confirm(
        "Approve this deposit? This will add funds to the user's balance.",
      )
    )
      return;
    queryClient.setQueryData<DepositReq[]>(['deposits'], (prev) =>
      prev
        ? prev.map((d) => (d.id === id ? { ...d, status: 'Completed' } : d))
        : [],
    );
    const d = queryClient
      .getQueryData<DepositReq[]>(['deposits'])
      ?.find((x) => x.id === id);
    if (d) {
      queryClient.setQueryData<BalanceRow[]>(['balances'], (prev) =>
        prev
          ? prev.map((b) =>
              b.user === d.user ? { ...b, balance: b.balance + d.amount } : b,
            )
          : [],
      );
      queryClient.setQueryData<Txn[]>(['transactions'], (l = []) => [
        {
          datetime: new Date().toISOString().slice(0, 16).replace('T', ' '),
          action: 'Deposit Approved',
          amount: +d.amount,
          by: 'Admin_You',
          notes: `${d.method} confirmed`,
          status: 'Completed',
        },
        ...(l ?? []),
      ]);
    }
    notify('Deposit approved successfully');
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
    queryClient.setQueryData<WithdrawalReq[]>(['withdrawalRequests'], (prev) =>
      prev
        ? prev.map((w) => (w.id === id ? { ...w, status: 'Completed' } : w))
        : [],
    );
    const w = queryClient
      .getQueryData<WithdrawalReq[]>(['withdrawalRequests'])
      ?.find((x) => x.id === id);
    if (w) {
      queryClient.setQueryData<BalanceRow[]>(['balances'], (prev) =>
        prev
          ? prev.map((b) =>
              b.user === w.user
                ? { ...b, balance: Math.max(0, b.balance - w.amount) }
                : b,
            )
          : [],
      );
      queryClient.setQueryData<Txn[]>(['transactions'], (l = []) => [
        {
          datetime: new Date().toISOString().slice(0, 16).replace('T', ' '),
          action: 'Withdrawal Approved',
          amount: -w.amount,
          by: 'Admin_You',
          notes: `${w.bank} ${w.masked}`,
          status: 'Completed',
        },
        ...(l ?? []),
      ]);
    }
    notify('Withdrawal approved successfully');
  };

  const rejectWithdrawal = (id: string) => {
    rejectPayload.current = { kind: 'withdrawal', id };
    setRejectOpen(true);
  };

  const confirmRejection = (reason: string) => {
    const payload = rejectPayload.current;
    if (!payload) return;
    if (payload.kind === 'deposit') {
      queryClient.setQueryData<DepositReq[]>(['deposits'], (prev) =>
        prev
          ? prev.map((d) =>
              d.id === payload.id ? { ...d, status: 'Rejected' } : d,
            )
          : [],
      );
      const d = queryClient
        .getQueryData<DepositReq[]>(['deposits'])
        ?.find((x) => x.id === payload.id);
      if (d) {
        queryClient.setQueryData<Txn[]>(['transactions'], (l = []) => [
          {
            datetime: new Date().toISOString().slice(0, 16).replace('T', ' '),
            action: 'Deposit Rejected',
            amount: 0,
            by: 'Admin_You',
            notes: reason,
            status: 'Rejected',
          },
          ...(l ?? []),
        ]);
      }
    } else {
      queryClient.setQueryData<WithdrawalReq[]>(
        ['withdrawalRequests'],
        (prev) =>
          prev
            ? prev.map((w) =>
                w.id === payload.id ? { ...w, status: 'Rejected' } : w,
              )
            : [],
      );
      const w = queryClient
        .getQueryData<WithdrawalReq[]>(['withdrawalRequests'])
        ?.find((x) => x.id === payload.id);
      if (w) {
        queryClient.setQueryData<Txn[]>(['transactions'], (l = []) => [
          {
            datetime: new Date().toISOString().slice(0, 16).replace('T', ' '),
            action: 'Withdrawal Rejected',
            amount: 0,
            by: 'Admin_You',
            notes: reason,
            status: 'Rejected',
          },
          ...(l ?? []),
        ]);
      }
    }
    notify('Request rejected successfully');
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
    if (action === 'freeze') {
      queryClient.setQueryData<BalanceRow[]>(['balances'], (prev) =>
        prev
          ? prev.map((b) =>
              b.user === mbUser.user ? { ...b, status: 'Frozen' } : b,
            )
          : [],
      );
      queryClient.setQueryData<Txn[]>(['transactions'], (l = []) => [
        {
          datetime: new Date().toISOString().slice(0, 16).replace('T', ' '),
          action: 'Freeze Funds',
          amount: 0,
          by: 'Admin_You',
          notes,
          status: 'Completed',
        },
        ...(l ?? []),
      ]);
      notify('Funds frozen');
      return;
    }
    const delta = action === 'add' ? amount : -amount;
    queryClient.setQueryData<BalanceRow[]>(['balances'], (prev) =>
      prev
        ? prev.map((b) =>
            b.user === mbUser.user
              ? { ...b, balance: Math.max(0, b.balance + delta) }
              : b,
          )
        : [],
    );
    queryClient.setQueryData<Txn[]>(['transactions'], (l = []) => [
      {
        datetime: new Date().toISOString().slice(0, 16).replace('T', ' '),
        action: action === 'add' ? 'Manual Add' : 'Manual Remove',
        amount: delta,
        by: 'Admin_You',
        notes,
        status: 'Completed',
      },
      ...(l ?? []),
    ]);
    notify('Balance updated');
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
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transaction_log.csv';
    a.click();
    URL.revokeObjectURL(url);
    notify('CSV export started');
  };

  const updateIBAN = (newIban: string, newHolder: string, notes: string) => {
    setIbanFull(newIban);
    setIbanHolder(newHolder);
    setIbanInstructions(notes || 'No special instructions');
    setIbanHistory((h) => [
      {
        date: new Date().toISOString().slice(0, 16).replace('T', ' '),
        oldIban: '****',
        newIban,
        by: 'Admin_You',
        notes: notes || '-',
      },
      ...h,
    ]);
    notify('IBAN updated successfully');
  };

  const reuseIBAN = (iban: string) => {
    alert(`Loaded IBAN for reuse:\n${iban}`);
  };

  const pageInfo = useMemo(
    () => `Showing 1-10 of ${log.length.toLocaleString()} transactions`,
    [log.length],
  );

  /* --------------------------------- UI --------------------------------- */
  return (
    <div className="space-y-8">
      {/* Filters */}
      <section className="mb-2">
        <div className="flex gap-3">
          {filters.map((f) => (
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
          ))}
        </div>
      </section>

      {depositsLoading ? (
        <div className="flex justify-center" aria-label="loading deposits">
          <FontAwesomeIcon icon={faSpinner} spin />
        </div>
      ) : depositsError ? (
        <p role="alert">{depositsErrorMessage || 'Failed to load deposits.'}</p>
      ) : (
        <DepositTable
          deposits={deposits}
          onApprove={approveDeposit}
          onReject={rejectDeposit}
          onAddComment={addComment}
          onViewReceipt={openReceipt}
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
      ) : (
        <WithdrawalTable
          withdrawals={withdrawals}
          onApprove={approveWithdrawal}
          onReject={rejectWithdrawal}
        />
      )}

      {/* User Balance Management */}
      {balancesLoading ? (
        <div className="flex justify-center" aria-label="loading balances">
          <FontAwesomeIcon icon={faSpinner} spin />
        </div>
      ) : usersError ? (
        <p role="alert">{usersErrorMessage || 'Failed to load users.'}</p>
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

      {logLoading ? (
        <div className="flex justify-center" aria-label="loading history">
          <FontAwesomeIcon icon={faSpinner} spin />
        </div>
      ) : logError ? (
        <p role="alert">
          {logErrorMessage || 'Failed to load transaction history.'}
        </p>
      ) : (
        <TransactionHistory
          log={log}
          pageInfo={pageInfo}
          onExport={exportCSV}
        />
      )}

      {/* Modals */}
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
