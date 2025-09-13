'use client';

import Modal from '../../ui/Modal';

interface Props {
  open: boolean;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  userFilter: string;
  setUserFilter: (v: string) => void;
  resultLimit: number;
  setResultLimit: (n: number) => void;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
}

export default function AdvancedFilterModal({
  open,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  userFilter,
  setUserFilter,
  resultLimit,
  setResultLimit,
  onApply,
  onClear,
  onClose,
}: Props) {
  return (
    <Modal isOpen={open} onClose={onClose}>
      <div className="w-96 max-w-[90vw]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Advanced Filters</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Date Range
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-primary-bg border border-dark rounded-xl px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-primary-bg border border-dark rounded-xl px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">User</label>
            <input
              type="text"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full bg-primary-bg border border-dark rounded-xl px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Limit</label>
            <input
              type="number"
              value={resultLimit}
              onChange={(e) => setResultLimit(Number(e.target.value))}
              className="w-full bg-primary-bg border border-dark rounded-xl px-3 py-2 text-sm"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onApply}
              className="bg-accent-green hover:shadow-[0_0_20px_rgba(28,139,76,0.3)] px-4 py-2 rounded-xl flex-1"
            >
              Apply
            </button>
            <button
              onClick={onClear}
              className="border border-accent-yellow text-accent-yellow hover:bg-accent-yellow hover:text-black px-4 py-2 rounded-xl font-semibold flex-1"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
