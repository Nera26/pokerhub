import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionHistoryFilters, {
  buildSelectOptions,
  type SelectOption,
} from '../TransactionHistoryFilters';

describe('TransactionHistoryFilters', () => {
  it('renders date and select controls and notifies changes', async () => {
    const onChange = jest.fn();
    const filters = { start: '', end: '', type: '' };

    render(
      <TransactionHistoryFilters
        filters={filters}
        onChange={onChange}
        dateRange={{
          startKey: 'start',
          endKey: 'end',
          startLabel: 'Start date',
          endLabel: 'End date',
        }}
        selects={[
          {
            key: 'type',
            label: 'Filter by type',
            placeholderOption: { value: '', label: 'All Types' },
            options: [
              { value: 'deposit', label: 'Deposit' },
              { value: 'withdrawal', label: 'Withdrawal' },
            ],
          },
        ]}
      />,
    );

    fireEvent.change(screen.getByLabelText('Start date'), {
      target: { value: '2024-01-01' },
    });
    fireEvent.change(screen.getByLabelText('End date'), {
      target: { value: '2024-01-31' },
    });
    await userEvent.selectOptions(
      screen.getByLabelText('Filter by type'),
      'deposit',
    );

    expect(onChange).toHaveBeenCalledWith('start', '2024-01-01');
    expect(onChange).toHaveBeenCalledWith('end', '2024-01-31');
    expect(onChange).toHaveBeenCalledWith('type', 'deposit');
  });

  it('shows loading and error placeholders for selects', () => {
    const onChange = jest.fn();
    const filters = { type: '' };

    const { rerender } = render(
      <TransactionHistoryFilters
        filters={filters}
        onChange={onChange}
        selects={[
          {
            key: 'type',
            label: 'Filter by type',
            placeholderOption: { value: '', label: 'All Types' },
            loading: true,
            options: [{ value: 'deposit', label: 'Deposit' }],
          },
        ]}
      />,
    );

    expect(screen.getByText('Loading…')).toBeInTheDocument();

    rerender(
      <TransactionHistoryFilters
        filters={filters}
        onChange={onChange}
        selects={[
          {
            key: 'type',
            label: 'Filter by type',
            placeholderOption: { value: '', label: 'All Types' },
            error: true,
            options: [{ value: 'deposit', label: 'Deposit' }],
          },
        ]}
      />,
    );

    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  it('renders apply button when callback provided', async () => {
    const onChange = jest.fn();
    const onApply = jest.fn();
    const filters = { start: '', end: '' };

    render(
      <TransactionHistoryFilters
        filters={filters}
        onChange={onChange}
        dateRange={{ startKey: 'start', endKey: 'end' }}
        onApply={onApply}
        applyButtonLabel="Confirm"
      />,
    );

    const button = screen.getByRole('button', { name: 'Confirm' });
    await userEvent.click(button);
    expect(onApply).toHaveBeenCalled();
  });
});

describe('buildSelectOptions', () => {
  it('deduplicates options and respects default items', () => {
    const prepend: SelectOption[] = [{ value: '', label: 'All Players' }];

    const options = buildSelectOptions({
      data: [
        { id: '1', name: 'Alice' },
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' },
      ],
      getValue: (item) => item.id,
      getLabel: (item) => item.name,
      prependOptions: prepend,
    });

    expect(options).toEqual([
      { value: '', label: 'All Players' },
      { value: '1', label: 'Alice' },
      { value: '2', label: 'Bob' },
    ]);
  });

  it('applies filter predicate before mapping', () => {
    const options = buildSelectOptions({
      data: ['All Types', 'Deposit', 'Withdrawal'],
      getValue: (item) => item.toLowerCase(),
      getLabel: (item) => item,
      prependOptions: [{ value: 'all-types', label: 'All Types' }],
      filter: (value) => value !== 'All Types',
    });

    expect(options).toEqual([
      { value: 'all-types', label: 'All Types' },
      { value: 'deposit', label: 'Deposit' },
      { value: 'withdrawal', label: 'Withdrawal' },
    ]);
  });
});
