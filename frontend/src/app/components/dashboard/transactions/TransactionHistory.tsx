import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';

import StatusPill, { toStatus } from './StatusPill';
import type { Txn } from './types';
import { useVirtualizer } from '@tanstack/react-virtual';

const usd = (n: number) =>
  (n < 0 ? '-' : n > 0 ? '+' : '') + '$' + Math.abs(n).toLocaleString();

interface Props {
  log: Txn[];
  pageInfo: string;
  onExport: () => void;
}

export default function TransactionHistory({ log, pageInfo, onExport }: Props) {
  const parentRef = React.useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: log.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    initialRect: { width: 0, height: 400 },
  });

  return (
    <section>
      <div className="bg-card-bg p-6 rounded-2xl card-shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Unified Transaction Log</h3>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <input
                type="date"
                className="bg-primary-bg border border-dark rounded-2xl px-3 py-2 text-sm"
              />
              <input
                type="date"
                className="bg-primary-bg border border-dark rounded-2xl px-3 py-2 text-sm"
              />
              <select className="bg-primary-bg border border-dark rounded-2xl px-3 py-2 text-sm">
                <option>All Players</option>
                <option>Mike_P</option>
                <option>Sarah_K</option>
                <option>Alex_R</option>
              </select>
              <select className="bg-primary-bg border border-dark rounded-2xl px-3 py-2 text-sm">
                <option>All Types</option>
                <option>Deposit</option>
                <option>Withdrawal</option>
                <option>Manual Add</option>
                <option>Manual Remove</option>
                <option>Freeze</option>
              </select>
            </div>
            <button
              onClick={onExport}
              className="bg-accent-blue hover:brightness-110 px-4 py-2 rounded-2xl font-semibold text-sm"
            >
              <FontAwesomeIcon icon={faDownload} className="mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        <div ref={parentRef} className="overflow-auto max-h-96">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark">
                <th className="text-left py-3 px-2 text-text-secondary">
                  Date &amp; Time
                </th>
                <th className="text-left py-3 px-2 text-text-secondary">
                  Action
                </th>
                <th className="text-left py-3 px-2 text-text-secondary">
                  Amount
                </th>
                <th className="text-left py-3 px-2 text-text-secondary">
                  Performed By
                </th>
                <th className="text-left py-3 px-2 text-text-secondary">
                  Notes
                </th>
                <th className="text-left py-3 px-2 text-text-secondary">
                  Status
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
              {rowVirtualizer.getVirtualItems().length > 0
                ? rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const t = log[virtualRow.index];
                    return (
                      <tr
                        key={virtualRow.index}
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
                        <td className="py-3 px-2 text-text-secondary">
                          {t.datetime}
                        </td>
                        <td className="py-3 px-2">{t.action}</td>
                        <td
                          className={
                            'py-3 px-2 font-semibold ' +
                            (t.amount > 0
                              ? 'text-accent-green'
                              : t.amount < 0
                                ? 'text-danger-red'
                                : '')
                          }
                        >
                          {usd(t.amount)}
                        </td>
                        <td className="py-3 px-2">{t.by}</td>
                        <td className="py-3 px-2 text-text-secondary">
                          {t.notes}
                        </td>
                        <td className="py-3 px-2">
                          <StatusPill status={toStatus(t.status)} />
                        </td>
                      </tr>
                    );
                  })
                : log.map((t, i) => (
                    <tr
                      key={i}
                      className="border-b border-dark hover:bg-hover-bg"
                    >
                      <td className="py-3 px-2 text-text-secondary">
                        {t.datetime}
                      </td>
                      <td className="py-3 px-2">{t.action}</td>
                      <td
                        className={
                          'py-3 px-2 font-semibold ' +
                          (t.amount > 0
                            ? 'text-accent-green'
                            : t.amount < 0
                              ? 'text-danger-red'
                              : '')
                        }
                      >
                        {usd(t.amount)}
                      </td>
                      <td className="py-3 px-2">{t.by}</td>
                      <td className="py-3 px-2 text-text-secondary">
                        {t.notes}
                      </td>
                      <td className="py-3 px-2">
                        <StatusPill status={toStatus(t.status)} />
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center mt-4">
          <span className="text-text-secondary text-sm">{pageInfo}</span>
          <div className="flex gap-2">
            <button className="bg-hover-bg hover:bg-accent-yellow hover:text-black px-3 py-2 rounded-2xl text-sm">
              Previous
            </button>
            <button className="bg-accent-yellow text-black px-3 py-2 rounded-2xl text-sm">
              1
            </button>
            <button className="bg-hover-bg hover:bg-accent-yellow hover:text-black px-3 py-2 rounded-2xl text-sm">
              2
            </button>
            <button className="bg-hover-bg hover:bg-accent-yellow hover:text-black px-3 py-2 rounded-2xl text-sm">
              3
            </button>
            <button className="bg-hover-bg hover:bg-accent-yellow hover:text-black px-3 py-2 rounded-2xl text-sm">
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
