import { Account } from '../../src/wallet/account.entity';

export const walletAccounts: Partial<Account>[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'user',
    balance: 1000,
    currency: 'USD',
  },
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'reserve',
    balance: 0,
    currency: 'USD',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'house',
    balance: 0,
    currency: 'USD',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'rake',
    balance: 0,
    currency: 'USD',
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    name: 'prize',
    balance: 0,
    currency: 'USD',
  },
];
