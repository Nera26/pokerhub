import Image from 'next/image';

import TransactionTable from './TransactionTable';
import StatusPill, { toStatus } from './StatusPill';
import useTransactionVirtualizer from '@/hooks/useTransactionVirtualizer';
import type { WithdrawalReq } from './types';
import useRenderCount from '@/hooks/useRenderCount';

interface Props {
  withdrawals: WithdrawalReq[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export default function WithdrawalTable({
  withdrawals,
  onApprove,
  onReject,
}: Props) {
  useRenderCount('WithdrawalTable');
  const { parentRef, sortedItems, rowVirtualizer } =
    useTransactionVirtualizer(withdrawals);
  return (
    <TransactionTable
      title="Withdrawal Requests"
      items={sortedItems}
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
            <span className="font-semibold text-danger-red">${w.amount}</span>
          ),
        },
        {
          label: 'Bank Info',
          render: (w) => (
            <div className="text-xs">
              <div>{w.bank}</div>
              <div className="text-text-secondary">{w.masked}</div>
            </div>
          ),
        },
        {
          label: 'Date',
          render: (w) => <span className="text-text-secondary">{w.date}</span>,
        },
        {
          label: 'Comment',
          render: (w) => <span className="text-text-secondary">{w.comment}</span>,
        },
        {
          label: 'Status',
          render: (w) => <StatusPill status={toStatus(w.status)} />,
        },
      ]}
      actions={[
        {
          label: 'Approve',
          onClick: (w) => onApprove(w.id),
          className:
            'bg-accent-green hover:brightness-110 px-2 py-1 rounded text-xs font-semibold',
        },
        {
          label: 'Reject',
          onClick: (w) => onReject(w.id),
          className:
            'bg-danger-red hover:bg-red-600 px-2 py-1 rounded text-xs font-semibold',
        },
      ]}
      parentRef={parentRef}
      rowVirtualizer={rowVirtualizer}
    />
  );
}

