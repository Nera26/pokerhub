export type StatusBadge = 'Pending' | 'Completed' | 'Rejected';

export type DepositReq = {
  id: string;
  user: string;
  avatar: string;
  amount: number;
  method: string;
  date: string;
  receiptUrl?: string;
  status: StatusBadge;
};

export type WithdrawalReq = {
  id: string;
  user: string;
  avatar: string;
  amount: number;
  bank: string;
  maskedAccount: string;
  date: string;
  comment: string;
  status: StatusBadge;
};

export type Txn = {
  datetime: string;
  action: string;
  amount: number;
  by: string;
  notes: string;
  status: StatusBadge;
};
