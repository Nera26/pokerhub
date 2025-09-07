import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionHistoryTable, {
  type Column,
  type Action,
} from '../TransactionHistoryTable';
import { useVirtualizer } from '@tanstack/react-virtual';

jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: jest.fn(),
}));

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
  const useVirtualizerMock = useVirtualizer as jest.Mock;

  beforeEach(() => {
    useVirtualizerMock.mockReset();
  });

  it('renders actions and triggers callbacks without virtualization', async () => {
    useVirtualizerMock.mockReturnValue({
      getVirtualItems: () => [],
      measureElement: jest.fn(),
      getTotalSize: () => 0,
    });

    const onView = jest.fn();
    const actions: Action<Row>[] = [
      {
        label: 'View',
        onClick: onView,
        className: 'btn',
      },
    ];
    const data: Row[] = [{ id: '1', name: 'Alice' }];

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
    useVirtualizerMock.mockReturnValue({
      getVirtualItems: () => [{ index: 0, start: 0 }],
      measureElement: jest.fn(),
      getTotalSize: () => 100,
    });

    const onView = jest.fn();
    const actions: Action<Row>[] = [
      {
        label: 'View',
        onClick: onView,
        className: 'btn',
      },
    ];
    const data: Row[] = [{ id: '1', name: 'Alice' }];

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
