'use client';

import useRenderCount from '@/hooks/useRenderCount';
import TransactionHistorySection from '@/app/components/common/TransactionHistorySection';

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  date: string; // formatted date & time
  status: string;
}

export interface TransactionHistoryProps {
  /** List of transaction records */
  transactions: Transaction[];
  /** Currency code for displaying amounts */
  currency: string;
}

export default function WalletTransactionHistory({
  transactions,
  currency,
}: TransactionHistoryProps) {
  useRenderCount('TransactionHistory');
  return <TransactionHistorySection data={transactions} currency={currency} />;
}

