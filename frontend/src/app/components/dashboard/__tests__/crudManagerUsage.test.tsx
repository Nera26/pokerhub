import { renderWithClient } from './renderWithClient';
import ManageTables from '../ManageTables';
import ManageTournaments from '../ManageTournaments';
import { useAdminCrud, useAdminCrudTable } from '@/hooks/admin/useAdminCrud';
import { useAdminTournamentFilters } from '@/hooks/admin/useTournamentFilters';

jest.mock('next-intl', () => ({
  useLocale: () => 'en',
}));

jest.mock('@/hooks/useTranslations', () => ({
  useTranslations: () => ({ data: {} }),
}));

type CrudStateReturn = ReturnType<typeof createCrudStateStub>;
type CrudTableReturn = ReturnType<typeof createCrudTableStub>;

const createCrudStateStub = () => ({
  items: [],
  isLoading: false,
  error: null,
  listError: null,
  refetch: jest.fn(),
  mutations: {
    create: {
      execute: jest.fn(),
      mutation: { isPending: false },
      isEnabled: true,
    },
    update: {
      execute: jest.fn(),
      mutation: { isPending: false },
      isEnabled: true,
    },
    delete: {
      execute: jest.fn(),
      mutation: { isPending: false },
      isEnabled: true,
    },
  },
  formatActionError: jest.fn(),
  formatListError: jest.fn(),
  getItemId: jest.fn(),
});

const createCrudTableStub = () => ({
  modals: {
    mode: null,
    selected: null,
    isCreateOpen: false,
    isEditOpen: false,
    isDeleteOpen: false,
    openCreate: jest.fn(),
    openEdit: jest.fn(),
    openDelete: jest.fn(),
    close: jest.fn(),
  },
  actions: {
    submitCreate: jest.fn(),
    submitUpdate: jest.fn(),
    submitDelete: jest.fn(),
    createMutation: { isPending: false },
    updateMutation: { isPending: false },
    deleteMutation: { isPending: false },
  },
  formError: null,
  setFormError: jest.fn(),
  table: {
    props: {
      items: [],
      header: null,
      renderRow: () => null,
      searchFilter: () => true,
      searchPlaceholder: '',
      emptyMessage: '',
      caption: undefined,
      pageSize: undefined,
    },
    key: 0,
    View: () => <div data-testid="crud-view" />,
  },
  resetTableState: jest.fn(),
});

jest.mock('@/hooks/admin/useAdminCrud', () => ({
  useAdminCrud: jest.fn(() => createCrudStateStub()),
  useAdminCrudTable: jest.fn(() => createCrudTableStub()),
}));

jest.mock('@/hooks/admin/useTournamentFilters', () => ({
  useAdminTournamentFilters: jest.fn(() => ({
    data: [{ id: 'all', label: 'All' }],
    isLoading: false,
  })),
}));

describe('admin dashboard screens', () => {
  const mockedUseAdminCrud = useAdminCrud as jest.MockedFunction<
    typeof useAdminCrud
  >;
  const mockedUseAdminCrudTable = useAdminCrudTable as jest.MockedFunction<
    typeof useAdminCrudTable
  >;
  const mockedUseAdminTournamentFilters =
    useAdminTournamentFilters as jest.MockedFunction<
      typeof useAdminTournamentFilters
    >;

  beforeEach(() => {
    mockedUseAdminCrud.mockImplementation(
      () => createCrudStateStub() as CrudStateReturn,
    );
    mockedUseAdminCrudTable.mockImplementation(
      () => createCrudTableStub() as CrudTableReturn,
    );
    mockedUseAdminTournamentFilters.mockReturnValue({
      data: [{ id: 'all', label: 'All' }],
      isLoading: false,
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('uses the shared crud manager hook for tables and tournaments', () => {
    renderWithClient(<ManageTables />);
    renderWithClient(<ManageTournaments />);

    expect(mockedUseAdminCrud).toHaveBeenCalledTimes(2);
    const calls = mockedUseAdminCrud.mock.calls.map(([config]) => config);
    expect(calls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ queryKey: ['tables'] }),
        expect.objectContaining({ queryKey: ['admin', 'tournaments'] }),
      ]),
    );

    expect(mockedUseAdminCrudTable).toHaveBeenCalledTimes(2);
  });
});
