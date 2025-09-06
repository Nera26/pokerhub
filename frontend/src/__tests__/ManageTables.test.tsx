import { render, screen, waitFor } from '@testing-library/react';
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
    mockFetchTables.mockReset();
  });

  it('shows loading indicator', () => {
    mockFetchTables.mockReturnValue(new Promise<Table[]>(() => {}));
    renderWithClient();
    expect(screen.getByText(/loading tables/i)).toBeInTheDocument();
  });

  it('renders empty state when no tables', async () => {
    mockFetchTables.mockResolvedValue([]);
    renderWithClient();
    await waitFor(() =>
      expect(screen.getByText(/no tables found/i)).toBeInTheDocument(),
    );
  });

  it('renders table data on success', async () => {
    const table: Table = {
      id: '1',
      tableName: 'Main Table',
      gameType: 'texas',
      stakes: { small: 1, big: 2 },
      players: { current: 0, max: 9 },
      buyIn: { min: 50, max: 500 },
      stats: { handsPerHour: 0, avgPot: 0, rake: 0 },
      createdAgo: '1h',
    };
    mockFetchTables.mockResolvedValue([table]);
    renderWithClient();
    await waitFor(() =>
      expect(screen.getByText('Main Table')).toBeInTheDocument(),
    );
  });
});

