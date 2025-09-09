'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAdminTournaments,
  createAdminTournament,
  updateAdminTournament,
  deleteAdminTournament,
  fetchAdminTournamentDefaults,
} from '@/lib/api/admin';
import { z } from 'zod';
import { type AdminTournament } from '@shared/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';

import { CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { TableHead, TableRow } from '../ui/Table';
import ToastNotification from '../ui/ToastNotification';
import TournamentRow from './TournamentRow';
import TournamentModal from '../modals/TournamentModal';
import AdminTableManager from './common/AdminTableManager';

const statusEnum = z.enum(['scheduled', 'running', 'finished', 'cancelled']);
type Status = z.infer<typeof statusEnum>;
type Tournament = AdminTournament;

export default function ManageTournaments() {
  const queryClient = useQueryClient();
  const {
    data: rows = [],
    isLoading,
    error,
  } = useQuery<Tournament[]>({
    queryKey: ['admin', 'tournaments'],
    queryFn: fetchAdminTournaments,
  });
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all');

  // modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Tournament | null>(null);

  // toast
  const [toast, setToast] = useState<{
    open: boolean;
    msg: string;
    type: 'success' | 'error';
  }>({
    open: false,
    msg: '',
    type: 'success',
  });

  const { data: defaults } = useQuery({
    queryKey: ['admin', 'tournaments', 'defaults'],
    queryFn: fetchAdminTournamentDefaults,
    enabled: createOpen,
  });

  const filteredByStatus = useMemo(() => {
    return rows.filter((t) =>
      statusFilter === 'all' ? true : t.status === statusFilter,
    );
  }, [rows, statusFilter]);

  // actions
  const create = useMutation({
    mutationFn: (body: Tournament) => createAdminTournament(body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] }),
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Tournament }) =>
      updateAdminTournament(id, body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] }),
  });
  const remove = useMutation({
    mutationFn: (id: number) => deleteAdminTournament(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'tournaments'] }),
  });
  const openCreate = () => {
    setSelected(null);
    setCreateOpen(true);
  };
  const openEdit = (t: Tournament) => {
    setSelected(t);
    setEditOpen(true);
  };
  const openDelete = (t: Tournament) => {
    setSelected(t);
    setDeleteOpen(true);
  };

  const onCreate = (data: Tournament) => {
    create.mutate(data, {
      onSuccess: () => {
        setCreateOpen(false);
        setPage(1);
        setToast({ open: true, msg: 'Tournament created', type: 'success' });
      },
      onError: () =>
        setToast({ open: true, msg: 'Failed to create', type: 'error' }),
    });
  };
  const onEdit = (data: Tournament) => {
    if (!selected) return;
    update.mutate(
      { id: selected.id, body: data },
      {
        onSuccess: () => {
          setEditOpen(false);
          setToast({ open: true, msg: 'Changes saved', type: 'success' });
        },
        onError: () =>
          setToast({ open: true, msg: 'Failed to save', type: 'error' }),
      },
    );
  };
  const confirmDelete = () => {
    if (!selected) return;
    remove.mutate(selected.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        setSelected(null);
        setToast({
          open: true,
          msg: 'Tournament deleted',
          type: 'success',
        });
      },
      onError: () =>
        setToast({ open: true, msg: 'Failed to delete', type: 'error' }),
    });
  };

  const FilterBtn = ({
    active,
    onClick,
    className,
    children,
  }: React.PropsWithChildren<{
    active?: boolean;
    onClick: () => void;
    className?: string;
  }>) => (
    <button
      onClick={onClick}
      className={
        active
          ? 'bg-accent-yellow text-black px-4 py-2 rounded-xl font-semibold text-sm'
          : `bg-transparent border ${className} px-4 py-2 rounded-xl font-semibold text-sm transition-colors hover:bg-current hover:text-white`
      }
    >
      {children}
    </button>
  );
  if (isLoading) {
    return <div>Loading tournaments...</div>;
  }

  if (error) {
    return (
      <div role="alert" className="text-red-500">
        Failed to load tournaments.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Manage Tournaments</h2>
          <p className="text-text-secondary">
            Create, edit, delete, and monitor tournaments
          </p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <FontAwesomeIcon icon={faPlus} /> New Tournament
        </Button>
      </section>

      {/* Filters */}
      <section className="mb-2 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <FilterBtn
            active={statusFilter === 'all'}
            onClick={() => setStatusFilter('all')}
          >
            All
          </FilterBtn>
          <FilterBtn
            active={statusFilter === 'scheduled'}
            onClick={() => setStatusFilter('scheduled')}
            className="border-accent-blue text-accent-blue"
          >
            Scheduled
          </FilterBtn>
          <FilterBtn
            active={statusFilter === 'running'}
            onClick={() => setStatusFilter('running')}
            className="border-accent-green text-accent-green"
          >
            Running
          </FilterBtn>
          <FilterBtn
            active={statusFilter === 'finished'}
            onClick={() => setStatusFilter('finished')}
            className="border-text-secondary text-text-secondary"
          >
            Finished
          </FilterBtn>
          <FilterBtn
            active={statusFilter === 'cancelled'}
            onClick={() => setStatusFilter('cancelled')}
            className="border-red-500 text-red-500"
          >
            Cancelled
          </FilterBtn>
        </div>
      </section>

      <AdminTableManager
        items={filteredByStatus}
        header={
          <TableRow>
            <TableHead className="font-semibold">Tournament Name</TableHead>
            <TableHead className="font-semibold">Start Time</TableHead>
            <TableHead className="font-semibold">Buy-in & Fee</TableHead>
            <TableHead className="font-semibold">Prize Pool</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        }
        renderRow={(t) => (
          <TournamentRow
            key={t.id}
            tournament={t}
            onEdit={openEdit}
            onDelete={openDelete}
          />
        )}
        searchFilter={(t, q) =>
          !q ||
          t.name.toLowerCase().includes(q) ||
          t.gameType.toLowerCase().includes(q) ||
          t.format.toLowerCase().includes(q)
        }
        searchPlaceholder="Search tournaments..."
        emptyMessage="No tournaments found."
        caption="Admin view of tournaments"
      />

      {/* CREATE */}
      <TournamentModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        mode="create"
        defaultValues={defaults}
        onSubmit={onCreate}
      />

      {/* EDIT */}
      <TournamentModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        mode="edit"
        defaultValues={selected ?? undefined}
        onSubmit={onEdit}
      />

      {/* DELETE */}
      <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)}>
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
              onClick={() => setDeleteOpen(false)}
              className="border border-text-secondary"
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast */}
      <ToastNotification
        message={toast.msg}
        type={toast.type}
        isOpen={toast.open}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </div>
  );
}
