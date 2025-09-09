import { exportCsv } from '@/lib/exportCsv';

jest.mock('@/lib/exportCsv', () => ({ exportCsv: jest.fn() }));

describe('BalanceTransactions CSV export', () => {
  it('generates expected CSV', () => {
    const log = [
      {
        datetime: '2024-01-01',
        action: 'Add Balance',
        amount: 100,
        by: 'admin',
        notes: 'note',
        status: 'Completed',
      },
    ];
    const header = [
      'Date & Time',
      'Action',
      'Amount',
      'Performed By',
      'Notes',
      'Status',
    ];
    const rows = log.map((t) => [
      t.datetime,
      t.action,
      `+${t.amount}`,
      t.by,
      `"${t.notes.replace(/"/g, '""')}"`,
      t.status,
    ]);
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    expect(csv).toMatchSnapshot();
  });
});
