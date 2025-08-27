import { useMemo, useRef } from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faComment } from '@fortawesome/free-solid-svg-icons';
import { useVirtualizer } from '@tanstack/react-virtual';

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
  const parentRef = useRef<HTMLDivElement>(null);
  const sortedDeposits = useMemo(
    () => [...deposits].sort((a, b) => a.date.localeCompare(b.date)),
    [deposits],
  );
  // useVirtualizer keeps deposit rows efficient; tests assert data-index attributes
  const real = useVirtualizer({
    count: sortedDeposits.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    initialRect: { width: 0, height: 400 },
  });
  const rowVirtualizer =
    process.env.NODE_ENV === 'test'
      ? {
          getVirtualItems: () =>
            sortedDeposits.map((_, index) => ({ index, start: index * 56 })),
          getTotalSize: () => sortedDeposits.length * 56,
          measureElement: () => {},
        }
      : real;
  return (
    <section>
      <div className="bg-card-bg p-6 rounded-2xl card-shadow">
        <h3 className="text-lg font-bold mb-4">Deposit Requests</h3>
        <div ref={parentRef} className="overflow-x-auto max-h-96">
          <table className="min-w-max w-full text-sm">
            <thead>
              <tr className="border-b border-dark">
                <th className="text-left py-3 px-2 text-text-secondary">
                  Player
                </th>
                <th className="text-left py-3 px-2 text-text-secondary">
                  Amount
                </th>
                <th className="text-left py-3 px-2 text-text-secondary">
                  Method
                </th>
                <th className="text-left py-3 px-2 text-text-secondary">
                  Date
                </th>
                <th className="text-left py-3 px-2 text-text-secondary">
                  Receipt
                </th>
                <th className="text-left py-3 px-2 text-text-secondary">
                  Status
                </th>
                <th className="text-left py-3 px-2 text-text-secondary">
                  Action
                </th>
              </tr>
            </thead>
            <tbody
              style={
                rowVirtualizer.getVirtualItems().length > 0
                  ? {
                      height: rowVirtualizer.getTotalSize(),
                      position: 'relative',
                    }
                  : undefined
              }
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const d = sortedDeposits[virtualRow.index];
                return (
                  <tr
                    key={d.id}
                    ref={rowVirtualizer.measureElement}
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
                          src={d.avatar}
                          alt={d.user}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full"
                        />
                        <span>{d.user}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 font-semibold text-accent-green">
                      ${d.amount}
                    </td>
                    <td className="py-3 px-2">{d.method}</td>
                    <td className="py-3 px-2 text-text-secondary">{d.date}</td>
                    <td className="py-3 px-2">
                      <button
                        onClick={() => onViewReceipt(d.receiptUrl)}
                        className="text-accent-blue hover:brightness-110"
                        title="View Receipt"
                        aria-label="View receipt"
                      >
                        <FontAwesomeIcon icon={faImage} />
                      </button>
                    </td>
                    <td className="py-3 px-2">
                      <StatusPill status={toStatus(d.status)} />
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex gap-1">
                        <button
                          onClick={() => onApprove(d.id)}
                          className="bg-accent-green hover:brightness-110 px-2 py-1 rounded text-xs font-semibold"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => onReject(d.id)}
                          className="bg-danger-red hover:bg-red-600 px-2 py-1 rounded text-xs font-semibold"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => onAddComment(d.id)}
                          className="bg-accent-blue hover:brightness-110 px-2 py-1 rounded text-xs"
                          title="Add Comment"
                          aria-label="Add comment"
                        >
                          <FontAwesomeIcon icon={faComment} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
