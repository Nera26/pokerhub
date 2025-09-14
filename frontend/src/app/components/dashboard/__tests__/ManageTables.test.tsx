import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ManageTables from '../ManageTables';
import { fetchTables, createTable, updateTable } from '@/lib/api/table';
import { renderWithClient } from './renderWithClient';
import { fillTableForm } from './fillTableForm';

jest.mock('@/lib/api/table', () => ({
  fetchTables: jest.fn(),
  createTable: jest.fn(),
  updateTable: jest.fn(),
  deleteTable: jest.fn(),
}));

describe('ManageTables', () => {
  const mockFetchTables = fetchTables as jest.MockedFunction<
    typeof fetchTables
  >;
  const mockCreateTable = createTable as jest.MockedFunction<
    typeof createTable
  >;
  const mockUpdateTable = updateTable as jest.MockedFunction<
    typeof updateTable
  >;

  async function openEditTable() {
    mockFetchTables.mockResolvedValueOnce([
      {
        id: '1',
        tableName: 'Table 1',
        gameType: 'omaha',
        stakes: { small: 1, big: 2 },
        players: { current: 0, max: 6 },
        buyIn: { min: 50, max: 200 },
        stats: { handsPerHour: 0, avgPot: 0, rake: 0 },
        createdAgo: '1m',
      } as any,
    ]);
    renderWithClient(<ManageTables />);
    const updateBtn = await screen.findByRole('button', { name: /update/i });
    await userEvent.click(updateBtn);
  }

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
    await openEditTable();

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
    await openEditTable();
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
