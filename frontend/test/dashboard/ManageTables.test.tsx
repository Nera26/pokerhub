import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ManageTables from '@/app/components/dashboard/ManageTables';
import {
  fetchTables,
  createTable,
  updateTable,
  deleteTable,
} from '@/lib/api/table';
import type { Table } from '@shared/types';

jest.mock('@/lib/api/table', () => ({
  fetchTables: jest.fn(),
  createTable: jest.fn(),
  updateTable: jest.fn(),
  deleteTable: jest.fn(),
}));

describe('ManageTables', () => {
  const mockFetchTables = fetchTables as jest.MockedFunction<typeof fetchTables>;
  const mockCreateTable = createTable as jest.MockedFunction<typeof createTable>;
  const mockUpdateTable = updateTable as jest.MockedFunction<typeof updateTable>;

  function renderWithClient() {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return render(
      <QueryClientProvider client={client}>
        <ManageTables />
      </QueryClientProvider>,
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits form to create table', async () => {
    mockFetchTables.mockResolvedValueOnce([]);
    renderWithClient();

    const openBtn = await screen.findByText(/create table/i);
    await userEvent.click(openBtn);

    await userEvent.type(screen.getByLabelText(/table name/i), 'My Table');
    await userEvent.selectOptions(
      screen.getByLabelText(/game type/i),
      'omaha',
    );
    await userEvent.type(screen.getByLabelText(/small blind/i), '1');
    await userEvent.type(screen.getByLabelText(/big blind/i), '2');
    await userEvent.type(screen.getByLabelText(/starting stack/i), '100');
    await userEvent.type(screen.getByLabelText(/max players/i), '6');
    await userEvent.type(screen.getByLabelText(/min buy-in/i), '50');
    await userEvent.type(screen.getByLabelText(/max buy-in/i), '200');

    await userEvent.click(
      screen.getAllByRole('button', { name: /create table/i })[1],
    );

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
    mockFetchTables.mockResolvedValueOnce([]);
    mockCreateTable.mockRejectedValue(new Error('fail'));
    renderWithClient();

    const openBtn = await screen.findByText(/create table/i);
    await userEvent.click(openBtn);
    await userEvent.type(screen.getByLabelText(/table name/i), 'My Table');
    await userEvent.selectOptions(screen.getByLabelText(/game type/i), 'omaha');
    await userEvent.type(screen.getByLabelText(/small blind/i), '1');
    await userEvent.type(screen.getByLabelText(/big blind/i), '2');
    await userEvent.type(screen.getByLabelText(/starting stack/i), '100');
    await userEvent.type(screen.getByLabelText(/max players/i), '6');
    await userEvent.type(screen.getByLabelText(/min buy-in/i), '50');
    await userEvent.type(screen.getByLabelText(/max buy-in/i), '200');
    await userEvent.click(
      screen.getAllByRole('button', { name: /create table/i })[1],
    );

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Failed to create table',
      ),
    );
  });

  it('submits form to update table', async () => {
    const table: Table = {
      id: '1',
      tableName: 'Main',
      gameType: 'texas',
      stakes: { small: 1, big: 2 },
      players: { current: 0, max: 9 },
      buyIn: { min: 50, max: 500 },
      stats: { handsPerHour: 0, avgPot: 0, rake: 0 },
      createdAgo: '1h',
    };
    mockFetchTables.mockResolvedValueOnce([table]);
    renderWithClient();

    await waitFor(() => screen.getByText('Main'));
    await userEvent.click(screen.getByText(/update/i));

    const nameInput = screen.getByLabelText(/table name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Updated');

    await userEvent.click(screen.getByRole('button', { name: /update table/i }));

    await waitFor(() =>
      expect(mockUpdateTable).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ tableName: 'Updated' }),
      ),
    );
  });

  it('shows error when update table fails', async () => {
    const table: Table = {
      id: '1',
      tableName: 'Main',
      gameType: 'texas',
      stakes: { small: 1, big: 2 },
      players: { current: 0, max: 9 },
      buyIn: { min: 50, max: 500 },
      stats: { handsPerHour: 0, avgPot: 0, rake: 0 },
      createdAgo: '1h',
    };
    mockFetchTables.mockResolvedValueOnce([table]);
    mockUpdateTable.mockRejectedValue(new Error('fail'));
    renderWithClient();

    await waitFor(() => screen.getByText('Main'));
    await userEvent.click(screen.getByText(/update/i));
    await userEvent.click(screen.getByRole('button', { name: /update table/i }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Failed to update table',
      ),
    );
  });
});

