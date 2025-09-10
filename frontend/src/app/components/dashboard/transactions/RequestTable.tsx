import type { ReactNode } from 'react';
import TransactionHistorySection from '../../common/TransactionHistorySection';
import type { Action as TableAction } from '../../common/TransactionHistoryTable';

interface Props<
  T extends {
    id: string;
    amount: number;
    status: string;
    date?: string;
    datetime?: string;
    type?: string;
    action?: string;
    currency?: string;
  },
> {
  title: string;
  rows: T[];
  filters?: ReactNode;
  actions?: TableAction<T>[];
}

export default function RequestTable<
  T extends {
    id: string;
    amount: number;
    status: string;
    date?: string;
    datetime?: string;
    type?: string;
    action?: string;
    currency?: string;
  },
>({ title, rows, filters, actions }: Props<T>) {
  const currency = rows[0]?.currency ?? 'USD';
  return (
    <section>
      <div className="bg-card-bg p-6 rounded-2xl card-shadow">
        <h3 className="text-lg font-bold mb-4">{title}</h3>
        <TransactionHistorySection
          data={rows}
          currency={currency}
          filters={filters}
          actions={actions}
          emptyMessage={`No ${title.toLowerCase()}.`}
        />
      </div>
    </section>
  );
}
