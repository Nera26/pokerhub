import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionHistoryTable, {
  type Column,
  type Action,
} from '../TransactionHistoryTable';

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

  it('renders actions and triggers callbacks', async () => {
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
