'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCopy } from '@fortawesome/free-solid-svg-icons';
import type { AuditLogEntry, LogTypeClasses } from '@shared/types';

interface Props {
  row: AuditLogEntry | null;
  onClose: () => void;
  badgeClasses: LogTypeClasses;
}

export default function DetailModal({ row, onClose, badgeClasses }: Props) {
  if (!row) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card-bg p-6 rounded-2xl w-[500px] max-w-[90vw]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Log Details</h3>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary"
            title="Close"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1">
                Timestamp
              </label>
              <div className="bg-primary-bg p-3 rounded-xl text-sm">
                {row.timestamp}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1">
                Type
              </label>
              <div className="bg-primary-bg p-3 rounded-xl text-sm">
                <span
                  className={`px-2 py-1 rounded-lg text-xs font-semibold ${badgeClasses[row.type]}`}
                >
                  {row.type}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-1">
              Description
            </label>
            <div className="bg-primary-bg p-3 rounded-xl text-sm">
              {row.description}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1">
                User
              </label>
              <div className="bg-primary-bg p-3 rounded-xl text-sm flex items-center justify-between">
                {row.user}
                <button
                  onClick={() => navigator.clipboard.writeText(row.user)}
                  className="text-accent-blue hover:opacity-80"
                  title="Copy user"
                >
                  <FontAwesomeIcon icon={faCopy} />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1">
                IP Address
              </label>
              <div className="bg-primary-bg p-3 rounded-xl text-sm flex items-center justify-between">
                {row.ip}
                <button
                  onClick={() => navigator.clipboard.writeText(row.ip)}
                  className="text-accent-blue hover:opacity-80"
                  title="Copy IP"
                >
                  <FontAwesomeIcon icon={faCopy} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4">
            <label className="flex items-center gap-2 mr-auto">
              <input type="checkbox" className="rounded" />
              <span className="text-sm">Mark as reviewed</span>
            </label>
            <button
              onClick={onClose}
              className="bg-accent-blue hover:bg-blue-600 px-4 py-2 rounded-xl font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
