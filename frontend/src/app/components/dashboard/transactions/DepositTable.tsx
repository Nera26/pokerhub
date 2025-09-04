import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faComment } from '@fortawesome/free-solid-svg-icons';

import TransactionTable from './TransactionTable';
import StatusPill, { toStatus } from './StatusPill';
import type { DepositReq } from './types';
import useRenderCount from '@/hooks/useRenderCount';

interface Props {
  deposits: DepositReq[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onAddComment: (id: string) => void;
  onViewReceipt: (url?: string) => void;
}

export default function DepositTable({
  deposits,
  onApprove,
  onReject,
  onAddComment,
  onViewReceipt,
}: Props) {
  useRenderCount('DepositTable');
  return (
    <TransactionTable
      title="Deposit Requests"
      items={deposits}
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
            <span className="font-semibold text-accent-green">${d.amount}</span>
          ),
        },
        { label: 'Method', render: (d) => d.method },
        {
          label: 'Date',
          render: (d) => <span className="text-text-secondary">{d.date}</span>,
        },
        {
          label: 'Receipt',
          render: (d) => (
            <button
              onClick={() => onViewReceipt(d.receiptUrl)}
              className="text-accent-blue hover:brightness-110"
              title="View Receipt"
              aria-label="View receipt"
            >
              <FontAwesomeIcon icon={faImage} />
            </button>
          ),
        },
        {
          label: 'Status',
          render: (d) => <StatusPill status={toStatus(d.status)} />,
        },
      ]}
      actions={[
        {
          label: 'Approve',
          onClick: (d) => onApprove(d.id),
          className:
            'bg-accent-green hover:brightness-110 px-2 py-1 rounded text-xs font-semibold',
        },
        {
          label: 'Reject',
          onClick: (d) => onReject(d.id),
          className:
            'bg-danger-red hover:bg-red-600 px-2 py-1 rounded text-xs font-semibold',
        },
        {
          icon: faComment,
          onClick: (d) => onAddComment(d.id),
          className:
            'bg-accent-blue hover:brightness-110 px-2 py-1 rounded text-xs',
          title: 'Add Comment',
          ariaLabel: 'Add comment',
        },
      ]}
    />
  );
}

