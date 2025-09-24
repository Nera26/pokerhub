'use client';

import { useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchAdminTournaments,
  createAdminTournament,
  updateAdminTournament,
  deleteAdminTournament,
  fetchAdminTournamentDefaults,
} from '@/lib/api/admin';
import {
  type AdminTournament,
  type AdminTournamentFilterOption,
} from '@shared/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';

import { CardTitle } from '../ui/Card';
import Modal from '../ui/Modal';
import { TableHead, TableRow } from '../ui/Table';
import ToastNotification from '../ui/ToastNotification';
import TournamentRow from './TournamentRow';
import TournamentModal from '../modals/TournamentModal';
import Button from '../ui/Button';
import AdminCrudPage from './common/AdminCrudPage';
import { useAdminTournamentFilters } from '@/hooks/admin/useTournamentFilters';

type Tournament = AdminTournament;

export default function ManageTournaments() {
  const { data: filters = [], isLoading: filtersLoading } =
    useAdminTournamentFilters();
  const filterOptions = useMemo(() => {
    if (!filters.length) return [];

    const seen = new Set<AdminTournamentFilterOption['id']>();
    return filters.filter((filter) => {
      if (seen.has(filter.id)) return false;
      seen.add(filter.id);
      return true;
    });
  }, [filters]);
  const preferredFilterId = useMemo(() => {
    const allOption = filterOptions.find((option) => option.id === 'all');
    return allOption?.id ?? filterOptions[0]?.id ?? 'all';
  }, [filterOptions]);

  const [statusFilter, setStatusFilter] =
    useState<AdminTournamentFilterOption['id']>(preferredFilterId);

  useEffect(() => {
    if (!filterOptions.length && statusFilter !== preferredFilterId) {
      setStatusFilter(preferredFilterId);
      return;
    }

    if (
      filterOptions.length &&
      !filterOptions.some((filter) => filter.id === statusFilter)
    ) {
      setStatusFilter(preferredFilterId);
    }
  }, [filterOptions, preferredFilterId, statusFilter]);

  const showFiltersSkeleton = filtersLoading && !filterOptions.length;

  const [toast, setToast] = useState<{
    open: boolean;
    msg: string;
    type: 'success' | 'error';
  }>({
    open: false,
    msg: '',
    type: 'success',
  });

  const defaultsQuery = useQuery({
    queryKey: ['admin', 'tournaments', 'defaults'],
    queryFn: fetchAdminTournamentDefaults,
    enabled: false,
  });

  const FilterBtn = ({
    active,
    onClick,
    className,
    children,
  }: PropsWithChildren<{
    active?: boolean;
    onClick: () => void;
    className?: string;
  }>) => (
    <button
      onClick={onClick}
      className={
        active
          ? 'bg-accent-yellow text-black px-4 py-2 rounded-xl font-semibold text-sm'
          : `bg-transparent border ${className ?? ''} px-4 py-2 rounded-xl font-semibold text-sm transition-colors hover:bg-current hover:text-white`
      }
    >
      {children}
    </button>
  );

  return (
    <AdminCrudPage<
      Tournament,
      Tournament,
      { id: number; body: Tournament },
      number
    >
      crudConfig={{
        queryKey: ['admin', 'tournaments'],
        fetchItems: fetchAdminTournaments,
        getItemId: (tournament) => tournament.id,
        create: {
          mutationFn: createAdminTournament,
        },
        update: {
          mutationFn: ({ id, body }) => updateAdminTournament(id, body),
        },
        remove: {
          mutationFn: deleteAdminTournament,
        },
        transformItems: (items) =>
          items.filter((t) =>
            statusFilter === 'all' ? true : t.status === statusFilter,
          ),
        table: {
          header: (
            <TableRow>
              <TableHead className="font-semibold">Tournament Name</TableHead>
              <TableHead className="font-semibold">Start Time</TableHead>
              <TableHead className="font-semibold">Buy-in & Fee</TableHead>
              <TableHead className="font-semibold">Prize Pool</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="text-right font-semibold">
                Actions
              </TableHead>
            </TableRow>
          ),
          renderRow: (tournament, { openEdit, openDelete }) => (
            <TournamentRow
              key={tournament.id}
              tournament={tournament}
              onEdit={openEdit}
              onDelete={openDelete}
            />
          ),
          searchFilter: (t, q) =>
            !q ||
            t.name.toLowerCase().includes(q) ||
            t.gameType.toLowerCase().includes(q) ||
            t.format.toLowerCase().includes(q),
          searchPlaceholder: 'Search tournaments...',
          emptyMessage: 'No tournaments found.',
          caption: 'Admin view of tournaments',
        },
        translationKeys: {
          searchPlaceholder: 'searchTournaments',
          emptyMessage: 'noTournamentsFound',
        },
        onSuccess: {
          create: () =>
            setToast({
              open: true,
              msg: 'Tournament created',
              type: 'success',
            }),
          update: () =>
            setToast({ open: true, msg: 'Changes saved', type: 'success' }),
          delete: () =>
            setToast({
              open: true,
              msg: 'Tournament deleted',
              type: 'success',
            }),
        },
        onError: {
          create: () =>
            setToast({ open: true, msg: 'Failed to create', type: 'error' }),
          update: () =>
            setToast({ open: true, msg: 'Failed to save', type: 'error' }),
          delete: () =>
            setToast({ open: true, msg: 'Failed to delete', type: 'error' }),
        },
      }}
      className="space-y-8"
      loadingState={<div>Loading tournaments...</div>}
      errorState={
        <div role="alert" className="text-red-500">
          Failed to load tournaments.
        </div>
      }
      primaryAction={{
        label: 'New Tournament',
        icon: <FontAwesomeIcon icon={faPlus} />,
        buttonProps: { className: 'flex items-center gap-2' },
        onClick: () => {
          void defaultsQuery.refetch();
        },
      }}
      renderHeader={({ PrimaryActionButton }) => (
        <section className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Manage Tournaments</h2>
            <p className="text-text-secondary">
              Create, edit, delete, and monitor tournaments
            </p>
          </div>
          {PrimaryActionButton}
        </section>
      )}
      renderFilters={() => (
        <section className="mb-2 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            {showFiltersSkeleton
              ? Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={`filter-skeleton-${idx}`}
                    aria-hidden="true"
                    className="h-9 w-20 rounded-xl bg-hover-bg animate-pulse"
                  />
                ))
              : filterOptions.map((filter) => (
                  <FilterBtn
                    key={filter.id}
                    active={statusFilter === filter.id}
                    onClick={() => setStatusFilter(filter.id)}
                    className={filter.colorClass}
                  >
                    {filter.label}
                  </FilterBtn>
                ))}
          </div>
        </section>
      )}
      renderModals={({ table }) => {
        if (!table) {
          return null;
        }

        const { modals, actions } = table;
        const selected = modals.selected;

        return (
          <>
            <TournamentModal
              isOpen={modals.isCreateOpen}
              onClose={modals.close}
              mode="create"
              defaultValues={defaultsQuery.data ?? undefined}
              onSubmit={(values) => actions.submitCreate(values)}
            />

            <TournamentModal
              isOpen={modals.isEditOpen}
              onClose={modals.close}
              mode="edit"
              defaultValues={selected ?? undefined}
              onSubmit={(values) => {
                if (!selected) return;
                actions.submitUpdate({ id: selected.id, body: values });
              }}
            />

            <Modal isOpen={modals.isDeleteOpen} onClose={modals.close}>
              <div className="text-center">
                <FontAwesomeIcon
                  icon={faExclamationTriangle}
                  className="text-4xl text-danger-red mb-4"
                />
                <CardTitle>Delete Tournament</CardTitle>
                <p className="text-text-secondary mb-6">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold">{selected?.name}</span>?
                </p>
                <div className="flex justify-center gap-3">
                  <Button
                    variant="ghost"
                    onClick={modals.close}
                    className="border border-text-secondary"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => actions.submitDelete()}
                  >
                    Confirm Delete
                  </Button>
                </div>
              </div>
            </Modal>

            <ToastNotification
              message={toast.msg}
              type={toast.type}
              isOpen={toast.open}
              onClose={() => setToast((t) => ({ ...t, open: false }))}
            />
          </>
        );
      }}
    />
  );
}
