import { renderHook } from '@testing-library/react';
import useTransactionHistoryExperience from '../useTransactionHistoryExperience';
import { useTransactionFilterQueries } from '@/hooks/useTransactionFilterQueries';
import { useTransactionHistoryControls } from '../TransactionHistoryControls';

jest.mock('@/hooks/useTransactionFilterQueries', () => ({
  useTransactionFilterQueries: jest.fn(),
}));

jest.mock('../TransactionHistoryControls', () => ({
  useTransactionHistoryControls: jest.fn(),
}));

describe('useTransactionHistoryExperience', () => {
  const mockUseFilterQueries = useTransactionFilterQueries as jest.Mock;
  const mockUseControls = useTransactionHistoryControls as jest.Mock;

  const historyOptions = {
    queryKey: ['test'],
    fetchTransactions: jest.fn(),
    initialFilters: { startDate: '', endDate: '', playerId: '', type: '' },
    pageSize: 10,
  } as const;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('combines history controls with metadata resolution', () => {
    const metadata = {
      filterOptions: { types: [], performedBy: [] },
      typeSelect: {
        placeholderOption: { value: '', label: 'All types' },
        options: [],
      },
      performedBySelect: {
        placeholderOption: { value: '', label: 'All performers' },
        options: [],
      },
      playerSelect: {
        placeholderOption: { value: '', label: 'All players' },
        options: [],
      },
      players: [],
      types: [],
    };
    const filterQueries = ['filters'] as any;
    const resolveMetadata = jest.fn().mockReturnValue(metadata);
    mockUseFilterQueries.mockReturnValue({
      queries: filterQueries,
      resolveMetadata,
    });

    const handleExport = jest.fn();
    const history = { data: [], isLoading: false };
    const queries = {
      players: {
        data: [],
        error: null,
        isLoading: false,
        isFetching: false,
        refetch: jest.fn(),
      },
      types: {
        data: [],
        error: null,
        isLoading: false,
        isFetching: false,
        refetch: jest.fn(),
      },
      filters: {
        data: [],
        error: null,
        isLoading: false,
        isFetching: false,
        refetch: jest.fn(),
      },
    };
    mockUseControls.mockReturnValue({
      history,
      queries,
      handleExport,
    });

    const onExport = jest.fn();
    const { result } = renderHook(() =>
      useTransactionHistoryExperience({
        locale: 'en',
        includePlayers: true,
        includeTypes: true,
        history: historyOptions,
        onExport,
      }),
    );

    expect(mockUseFilterQueries).toHaveBeenCalledWith({
      locale: 'en',
      includePlayers: true,
      includeTypes: true,
      filtersEnabled: undefined,
    });
    expect(mockUseControls).toHaveBeenCalledWith({
      history: historyOptions,
      queries: filterQueries,
      onExport,
    });
    expect(resolveMetadata).toHaveBeenCalledWith(queries);
    expect(result.current.history).toBe(history);
    expect(result.current.metadata).toBe(metadata);
    expect(result.current.handleExport).toBe(handleExport);
    expect(result.current.queries).toBe(queries);
  });

  it('propagates query errors from controls', () => {
    const metadata = {
      filterOptions: { types: [], performedBy: [] },
      typeSelect: {
        placeholderOption: { value: '', label: 'All types' },
        options: [],
      },
      performedBySelect: {
        placeholderOption: { value: '', label: 'All performers' },
        options: [],
      },
      playerSelect: undefined,
      players: undefined,
      types: undefined,
    };
    const resolveMetadata = jest.fn().mockReturnValue(metadata);
    mockUseFilterQueries.mockReturnValue({
      queries: [] as any,
      resolveMetadata,
    });

    const error = new Error('filters failed');
    const queries = {
      filters: {
        data: [],
        error,
        isLoading: false,
        isFetching: false,
        refetch: jest.fn(),
      },
    };
    const handleExport = jest.fn();
    mockUseControls.mockReturnValue({
      history: { data: [], isLoading: false },
      queries,
      handleExport,
    });

    const { result } = renderHook(() =>
      useTransactionHistoryExperience({
        locale: 'en',
        includePlayers: false,
        includeTypes: false,
        filtersEnabled: true,
        history: historyOptions,
      }),
    );

    expect(mockUseFilterQueries).toHaveBeenCalledWith({
      locale: 'en',
      includePlayers: false,
      includeTypes: false,
      filtersEnabled: true,
    });
    expect(result.current.queries.filters.error).toBe(error);
    expect(result.current.metadata).toBe(metadata);
  });

  it('omits export handler when not provided', () => {
    const resolveMetadata = jest.fn().mockReturnValue({
      filterOptions: { types: [], performedBy: [] },
      typeSelect: {
        placeholderOption: { value: '', label: 'All types' },
        options: [],
      },
      performedBySelect: {
        placeholderOption: { value: '', label: 'All performers' },
        options: [],
      },
      playerSelect: undefined,
      players: undefined,
      types: undefined,
    });
    mockUseFilterQueries.mockReturnValue({
      queries: [] as any,
      resolveMetadata,
    });

    const handleExport = jest.fn();
    mockUseControls.mockReturnValue({
      history: { data: [], isLoading: false },
      queries: {} as any,
      handleExport,
    });

    renderHook(() =>
      useTransactionHistoryExperience({
        locale: 'en',
        includePlayers: false,
        includeTypes: false,
        history: historyOptions,
      }),
    );

    expect(mockUseControls).toHaveBeenCalledWith({
      history: historyOptions,
      queries: [] as any,
      onExport: undefined,
    });
  });
});
