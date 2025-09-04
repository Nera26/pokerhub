import Image from 'next/image';

import StatusPill, { toStatus } from './StatusPill';
import type { WithdrawalReq } from './types';
import useTransactionVirtualizer from './useTransactionVirtualizer';
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
  const { parentRef, sortedItems: sortedWithdrawals, rowVirtualizer } =
    useTransactionVirtualizer(withdrawals);
  return (
    <section>
      <div className="bg-card-bg p-6 rounded-2xl card-shadow">
        <h3 className="text-lg font-bold mb-4">Withdrawal Requests</h3>
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
                  Bank Info
                </th>
                <th className="text-left py-3 px-2 text-text-secondary">
                  Date
                </th>
                <th className="text-left py-3 px-2 text-text-secondary">
                  Comment
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
                const w = sortedWithdrawals[virtualRow.index];
                return (
                  <tr
                    key={w.id}
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
                          src={w.avatar}
                          alt={w.user}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full"
                        />
                        <span>{w.user}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 font-semibold text-danger-red">
                      ${w.amount}
                    </td>
                    <td className="py-3 px-2 text-xs">
                      <div>{w.bank}</div>
                      <div className="text-text-secondary">{w.masked}</div>
                    </td>
                    <td className="py-3 px-2 text-text-secondary">{w.date}</td>
                    <td className="py-3 px-2 text-text-secondary">
                      {w.comment}
                    </td>
                    <td className="py-3 px-2">
                      <StatusPill status={toStatus(w.status)} />
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex gap-1">
                        <button
                          onClick={() => onApprove(w.id)}
                          className="bg-accent-green hover:brightness-110 px-2 py-1 rounded text-xs font-semibold"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => onReject(w.id)}
                          className="bg-danger-red hover:bg-red-600 px-2 py-1 rounded text-xs font-semibold"
                        >
                          Reject
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
