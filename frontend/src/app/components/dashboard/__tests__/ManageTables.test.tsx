import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createTable, updateTable } from '@/lib/api/table';
import { fillTableForm } from './fillTableForm';
import { searchTables } from './utils';

jest.mock('@/lib/api/table', () => ({
  fetchTables: jest.fn(),
  createTable: jest.fn(),
  updateTable: jest.fn(),
  deleteTable: jest.fn(),
}));

describe('ManageTables', () => {
  const mockCreateTable = createTable as jest.MockedFunction<
    typeof createTable
  >;
  const mockUpdateTable = updateTable as jest.MockedFunction<
    typeof updateTable
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits form to create table', async () => {
    await fillTableForm();

    await waitFor(() =>
      expect(mockCreateTable).toHaveBeenCalledWith({
        tableName: 'My Table',
        gameType: 'omaha',
        stakes: { small: 1, big: 2 },
        startingStack: 100,
        players: { max: 6 },
        buyIn: { min: 50, max: 200 },
      }),
    );
  });

  it('shows error when create table fails', async () => {
    await fillTableForm({ createTable: new Error('fail') });

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Failed to create table',
      ),
    );
  });

  it('submits form to update table', async () => {
    await searchTables();

    const nameInput = screen.getByLabelText(/table name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Updated');

    await userEvent.click(
      screen.getByRole('button', { name: /update table/i }),
    );

    await waitFor(() =>
      expect(mockUpdateTable).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ tableName: 'Updated' }),
      ),
    );
  });

  it('shows error when update table fails', async () => {
    mockUpdateTable.mockRejectedValue(new Error('fail'));
    await searchTables();
    await userEvent.click(
      screen.getByRole('button', { name: /update table/i }),
    );

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Failed to update table',
      ),
    );
  });
});
