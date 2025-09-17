import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ManageTables from '../ManageTables';
import { fetchTables, createTable, updateTable } from '@/lib/api/table';
import { renderWithClient } from './renderWithClient';
import { fillTableForm } from './fillTableForm';
import type { Table } from '@shared/types';
import { useGameTypes } from '@/hooks/useGameTypes';

jest.mock('@/lib/api/table', () => ({
  fetchTables: jest.fn(),
  createTable: jest.fn(),
  updateTable: jest.fn(),
  deleteTable: jest.fn(),
}));

// If ManageTables uses next-intl, keep a minimal mock to avoid provider setup in tests
jest.mock('next-intl', () => ({
  useLocale: () => 'en',
}));

jest.mock('@/hooks/useTranslations', () => ({
  useTranslations: () => ({ data: {} }),
}));

jest.mock('@/hooks/useGameTypes', () => ({
  useGameTypes: jest.fn(),
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
  const mockUseGameTypes = useGameTypes as jest.MockedFunction<
    typeof useGameTypes
  >;

  const createGameTypesResult = (
    overrides: Record<string, unknown> = {},
  ): ReturnType<typeof useGameTypes> =>
    ({
      data: [
        { id: 'texas', label: "Texas Hold'em" },
        { id: 'omaha', label: 'Omaha' },
      ],
      isLoading: false,
      error: null,
      ...overrides,
    }) as unknown as ReturnType<typeof useGameTypes>;

  async function openEditTable() {
    const table: Table = {
      id: '1',
      tableName: 'Table 1',
      gameType: 'omaha',
      stakes: { small: 1, big: 2 },
      startingStack: 500,
      players: { current: 0, max: 6 },
      buyIn: { min: 50, max: 200 },
      stats: { handsPerHour: 0, avgPot: 0, rake: 0 },
      createdAgo: '1m',
    };
    mockFetchTables.mockResolvedValueOnce([table]);
    renderWithClient(<ManageTables />);
    const updateBtn = await screen.findByRole('button', { name: /update/i });
    await userEvent.click(updateBtn);
    return screen.getByLabelText(/starting stack/i) as HTMLInputElement;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGameTypes.mockReturnValue(createGameTypesResult());
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

  it('prefills starting stack when editing table', async () => {
    const startingStackInput = await openEditTable();
    expect(startingStackInput).toHaveValue(500);
  });
});
