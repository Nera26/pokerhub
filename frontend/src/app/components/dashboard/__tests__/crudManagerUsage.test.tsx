import { renderWithClient } from './renderWithClient';
import ManageTables from '../ManageTables';
import ManageTournaments from '../ManageTournaments';
import { useCrudManager } from '@/hooks/admin/useCrudManager';

jest.mock('next-intl', () => ({
  useLocale: () => 'en',
}));

jest.mock('@/hooks/useTranslations', () => ({
  useTranslations: () => ({ data: {} }),
}));

type CrudReturn = ReturnType<typeof createCrudStub>;

const createCrudStub = () => ({
  isLoading: false,
  error: null,
  items: [],
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
    createMutation: { mutate: jest.fn() },
    updateMutation: { mutate: jest.fn() },
    deleteMutation: { mutate: jest.fn() },
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
  refetch: jest.fn(),
});

jest.mock('@/hooks/admin/useCrudManager', () => ({
  useCrudManager: jest.fn(() => createCrudStub()),
}));

describe('admin dashboard screens', () => {
  const mockedCrud = useCrudManager as jest.MockedFunction<
    typeof useCrudManager
  >;

  beforeEach(() => {
    mockedCrud.mockImplementation(() => createCrudStub() as CrudReturn);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('uses the shared crud manager hook for tables and tournaments', () => {
    renderWithClient(<ManageTables />);
    renderWithClient(<ManageTournaments />);

    expect(mockedCrud).toHaveBeenCalledTimes(2);
    const calls = mockedCrud.mock.calls.map(([config]) => config);
    expect(calls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ queryKey: ['tables'] }),
        expect.objectContaining({ queryKey: ['admin', 'tournaments'] }),
      ]),
    );
  });
});
