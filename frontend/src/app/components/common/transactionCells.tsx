import React from 'react';
import { useStatusInfo } from './status';

export function formatAmount(amt: number, currency: string) {
  const formatted = Math.abs(amt).toLocaleString(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amt >= 0 ? '+' : '-'}${formatted}`;
}

export function AmountCell({
  amount,
  currency,
}: {
  amount: number;
  currency: string;
}) {
  return (
    <span className={amount >= 0 ? 'text-accent-green' : 'text-danger-red'}>
      {formatAmount(amount, currency)}
    </span>
  );
}

export function StatusCell({ status }: { status: string }) {
  const getInfo = useStatusInfo();
  const { label, style } = getInfo(status);
  return (
    <span className={`${style} px-2 py-1 rounded-md font-medium`}>{label}</span>
  );
}
