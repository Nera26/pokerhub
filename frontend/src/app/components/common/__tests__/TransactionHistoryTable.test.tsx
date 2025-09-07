import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionHistoryTable, {
  type Column,
  type Action,
} from '../TransactionHistoryTable';
import useTransactionVirtualizer from '@/hooks/useTransactionVirtualizer';

jest.mock('@/hooks/useTransactionVirtualizer');

describe('TransactionHistoryTable', () => {
  interface Row {
    id: string;
    name: string;
  }

  const columns: Column<Row>[] = [
    {
      header: 'Name',
      cell: (row) => row.name,
      headerClassName: 'text-left',
      cellClassName: 'cell',
    },
  ];
  const useTransactionVirtualizerMock =
    useTransactionVirtualizer as jest.Mock;

  beforeEach(() => {
    useTransactionVirtualizerMock.mockReset();
  });

  it('renders actions and triggers callbacks without virtualization', async () => {
    const onView = jest.fn();
    const actions: Action<Row>[] = [
      {
        label: 'View',
        onClick: onView,
        className: 'btn',
      },
    ];
    const data: Row[] = [{ id: '1', name: 'Alice' }];

    useTransactionVirtualizerMock.mockReturnValue({
      parentRef: { current: null },
      sortedItems: data,
      rowVirtualizer: {
        getVirtualItems: () => [],
        measureElement: jest.fn(),
        getTotalSize: () => 0,
      },
    });

    render(
      <TransactionHistoryTable
        data={data}
        columns={columns}
        actions={actions}
        getRowKey={(row) => row.id}
      />,
    );

    expect(screen.getByText('Action')).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: 'View' });
    expect(btn).toBeInTheDocument();
    await userEvent.click(btn);
    expect(onView).toHaveBeenCalledWith(data[0]);
  });

  it('renders actions and triggers callbacks with virtualization', async () => {
    const onView = jest.fn();
    const actions: Action<Row>[] = [
      {
        label: 'View',
        onClick: onView,
        className: 'btn',
      },
    ];
    const data: Row[] = [{ id: '1', name: 'Alice' }];

    useTransactionVirtualizerMock.mockReturnValue({
      parentRef: { current: null },
      sortedItems: data,
      rowVirtualizer: {
        getVirtualItems: () => [{ index: 0, start: 0 }],
        measureElement: jest.fn(),
        getTotalSize: () => 100,
      },
    });

    render(
      <TransactionHistoryTable
        data={data}
        columns={columns}
        actions={actions}
        getRowKey={(row) => row.id}
      />,
    );

    expect(screen.getByText('Action')).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: 'View' });
    expect(btn).toBeInTheDocument();
    await userEvent.click(btn);
    expect(onView).toHaveBeenCalledWith(data[0]);
  });
});
