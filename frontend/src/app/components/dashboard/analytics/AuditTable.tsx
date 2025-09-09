'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEye,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import type { AuditLogEntry, LogTypeClasses } from '@shared/types';

interface Props {
  rows: AuditLogEntry[];
  page: number;
  pageCount: number;
  start: number;
  total: number;
  setPage: (p: number) => void;
  onView: (row: AuditLogEntry) => void;
  badgeClasses: LogTypeClasses;
}

export default function AuditTable({
  rows,
  page,
  pageCount,
  start,
  total,
  setPage,
  onView,
  badgeClasses,
}: Props) {
  return (
    <section className="bg-card-bg rounded-2xl shadow-[0_4px_8px_rgba(0,0,0,0.3)] overflow-hidden">
      <div className="p-6 border-b border-dark">
        <h3 className="text-lg font-bold">Recent System Events</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-primary-bg">
            <tr>
              <th className="text-left p-4 text-text-secondary font-semibold">
                Date
              </th>
              <th className="text-left p-4 text-text-secondary font-semibold">
                Type
              </th>
              <th className="text-left p-4 text-text-secondary font-semibold">
                Description
              </th>
              <th className="text-left p-4 text-text-secondary font-semibold">
                User
              </th>
              <th className="text-left p-4 text-text-secondary font-semibold">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-dark hover:bg-hover-bg transition-colors"
              >
                <td className="p-4 text-sm">{r.timestamp}</td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded-lg text-xs font-semibold ${badgeClasses[r.type]}`}
                  >
                    {r.type}
                  </span>
                </td>
                <td className="p-4 text-sm">{r.description}</td>
                <td className="p-4 text-sm">{r.user}</td>
                <td className="p-4">
                  <button
                    onClick={() => onView(r)}
                    className="text-accent-blue hover:opacity-80"
                    title="View"
                  >
                    <FontAwesomeIcon icon={faEye} />
                  </button>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-text-secondary">
                  No results
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-6 border-t border-dark flex items-center justify-between">
        <span className="text-text-secondary text-sm">
          Showing {Math.min(start + rows.length, total)} of {total} events
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="px-3 py-1 rounded-lg bg-primary-bg text-text-secondary hover:bg-hover-bg disabled:opacity-50"
            title="Previous"
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <button className="px-3 py-1 rounded-lg bg-accent-yellow text-black font-semibold">
            {page}
          </button>
          {page + 1 <= pageCount && (
            <button
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 rounded-lg bg-primary-bg text-text-secondary hover:bg-hover-bg"
            >
              {page + 1}
            </button>
          )}
          <button
            onClick={() => setPage(Math.min(pageCount, page + 1))}
            disabled={page >= pageCount}
            className="px-3 py-1 rounded-lg bg-primary-bg text-text-secondary hover:bg-hover-bg disabled:opacity-50"
            title="Next"
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </div>
    </section>
  );
}
