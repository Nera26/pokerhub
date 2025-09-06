'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAdminTournaments,
  createAdminTournament,
  updateAdminTournament,
  deleteAdminTournament,
} from '@/lib/api/admin';
import {
  useForm,
  type FieldErrors,
  type UseFormRegister,
  type UseFormWatch,
  type UseFormSetValue,
} from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faClock,
  faPlay,
  faEdit,
  faTrash,
  faSave,
  faChevronLeft,
  faChevronRight,
  faExclamationTriangle,
  faSearch,
} from '@fortawesome/free-solid-svg-icons';

import Card, { CardContent, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import {
  Table as UiTable,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/Table';
import ToastNotification from '../ui/ToastNotification';
import Tooltip from '../ui/Tooltip';

const statusEnum = z.enum(['scheduled', 'running', 'finished', 'cancelled']);
type Status = z.infer<typeof statusEnum>;
const tournamentSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Name is required'),
  gameType: z.string().min(1, 'Game type is required'),
  buyin: z.number().nonnegative('Buy-in must be at least 0'),
  fee: z.number().nonnegative('Fee must be at least 0'),
  prizePool: z.number().nonnegative('Prize pool must be at least 0'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  format: z.enum(['Regular', 'Turbo', 'Deepstack', 'Bounty', 'Freeroll']),
  seatCap: z.union([z.number().int().positive(), z.literal('')]).optional(),
  description: z.string().optional(),
  rebuy: z.boolean(),
  addon: z.boolean(),
  status: statusEnum.or(z.literal('auto-start')),
});
type Tournament = z.infer<typeof tournamentSchema>;

function dollars(n: number) {
  return n.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });
}
function dateLabel(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}
function timeLabel(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return (
    d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) +
    ' EST'
  );
}

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
  const [search, setSearch] = useState('');

  // pagination
  const [page, setPage] = useState(1);
  const pageSize = 5;

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

  // create/edit form
  const emptyTournament: Tournament = {
    id: 0,
    name: '',
    gameType: "Texas Hold'em",
    buyin: 0,
    fee: 0,
    prizePool: 0,
    date: '',
    time: '',
    format: 'Regular',
    seatCap: '',
    description: '',
    rebuy: false,
    addon: false,
    status: 'scheduled',
  };
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<Tournament>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: emptyTournament,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((t) => {
      const passStatus =
        statusFilter === 'all' ? true : t.status === statusFilter;
      const passSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.gameType.toLowerCase().includes(q) ||
        t.format.toLowerCase().includes(q);
      return passStatus && passSearch;
    });
  }, [rows, statusFilter, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

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
    reset(emptyTournament);
    setSelected(null);
    setCreateOpen(true);
  };
  const openEdit = (t: Tournament) => {
    setSelected(t);
    reset(t);
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

  const statusPill = (s: Tournament['status']) => {
    if (s === 'running')
      return (
        <span className="bg-accent-green px-3 py-1 rounded-full text-white text-sm font-semibold inline-flex items-center">
          <FontAwesomeIcon icon={faPlay} className="mr-1" /> Running
        </span>
      );
    if (s === 'scheduled' || s === 'auto-start')
      return (
        <span className="bg-accent-blue px-3 py-1 rounded-full text-white text-sm font-semibold inline-flex items-center">
          <FontAwesomeIcon icon={faClock} className="mr-1" /> Scheduled
        </span>
      );
    if (s === 'cancelled')
      return (
        <span className="bg-red-500 px-3 py-1 rounded-full text-white text-sm font-semibold inline-flex items-center">
          <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" />
          Cancelled
        </span>
      );
    return (
      <span className="bg-hover-bg px-3 py-1 rounded-full text-text-secondary text-sm font-semibold">
        Finished
      </span>
    );
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
      onClick={() => {
        setPage(1);
        onClick();
      }}
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

      {/* Filters + Search */}
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

        <div className="relative">
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
          />
          <input
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Search tournaments..."
            className="bg-card-bg border border-dark rounded-xl pl-10 pr-4 py-2 text-text-primary focus:border-accent-yellow focus:outline-none"
          />
        </div>
      </section>

      {/* Table */}
      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <UiTable className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">
                    Tournament Name
                  </TableHead>
                  <TableHead className="font-semibold">Start Time</TableHead>
                  <TableHead className="font-semibold">Buy-in & Fee</TableHead>
                  <TableHead className="font-semibold">Prize Pool</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right font-semibold">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div>
                        <p className="font-bold">{t.name}</p>
                        <p className="text-text-secondary text-sm">
                          {t.gameType} • {t.format}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold">{dateLabel(t.date)}</p>
                        <p className="text-text-secondary text-sm">
                          {timeLabel(t.time)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-accent-yellow font-bold">
                          {dollars(t.buyin)}
                        </p>
                        <p className="text-text-secondary text-sm">
                          +{dollars(t.fee)} fee
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-accent-yellow font-bold text-lg">
                          {dollars(t.prizePool)}
                        </p>
                        <p className="text-text-secondary text-sm">
                          Guaranteed
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{statusPill(t.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Tooltip text="Edit">
                          <button
                            onClick={() => openEdit(t)}
                            className="bg-accent-yellow text-black px-3 py-2 rounded-xl"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                        </Tooltip>
                        <Tooltip text="Delete">
                          <button
                            onClick={() => openDelete(t)}
                            className="bg-danger-red text-white px-3 py-2 rounded-xl"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {pageRows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-text-secondary"
                    >
                      No tournaments found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableCaption>Admin view of tournaments</TableCaption>
            </UiTable>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <section className="flex justify-center">
        <div className="flex items-center gap-2">
          <button
            className="bg-card-bg border border-dark text-text-secondary px-3 py-2 rounded-xl hover:bg-hover-bg hover:text-text-primary disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <button className="bg-accent-yellow text-black px-4 py-2 rounded-xl font-semibold">
            {page}
          </button>
          {page < pageCount && (
            <button
              className="bg-card-bg border border-dark text-text-secondary px-4 py-2 rounded-xl hover:bg-hover-bg hover:text-text-primary"
              onClick={() => setPage((p) => p + 1)}
            >
              {page + 1}
            </button>
          )}
          <button
            className="bg-card-bg border border-dark text-text-secondary px-3 py-2 rounded-xl hover:bg-hover-bg hover:text-text-primary disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={page === pageCount}
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </section>

      {/* CREATE */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)}>
        <div className="flex items-center justify-between mb-6">
          <CardTitle>Create New Tournament</CardTitle>
          <button
            onClick={() => setCreateOpen(false)}
            className="text-text-secondary hover:text-white text-xl"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <FormFields
          register={register}
          errors={errors}
          watch={watch}
          setValue={setValue}
        />
        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="ghost"
            onClick={() => setCreateOpen(false)}
            className="border border-text-secondary"
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit(onCreate)}>
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Create
          </Button>
        </div>
      </Modal>

      {/* EDIT */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)}>
        <div className="flex items-center justify-between mb-6">
          <CardTitle>Edit Tournament</CardTitle>
          <button
            onClick={() => setEditOpen(false)}
            className="text-text-secondary hover:text-white text-xl"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <FormFields
          register={register}
          errors={errors}
          watch={watch}
          setValue={setValue}
          includeStatus
          includeDescription
        />
        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="ghost"
            onClick={() => setEditOpen(false)}
            className="border border-text-secondary"
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit(onEdit)}>
            <FontAwesomeIcon icon={faSave} className="mr-2" />
            Save Changes
          </Button>
        </div>
      </Modal>

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

/* ---- Extracted form fields used in Create/Edit ---- */
function FormFields({
  register,
  errors,
  watch,
  setValue,
  includeStatus,
  includeDescription,
}: {
  register: UseFormRegister<Tournament>;
  errors: FieldErrors<Tournament>;
  watch: UseFormWatch<Tournament>;
  setValue: UseFormSetValue<Tournament>;
  includeStatus?: boolean;
  includeDescription?: boolean;
}) {
  const seatCap = watch('seatCap');
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          id="name"
          label="Tournament Name"
          error={errors.name?.message}
          {...register('name')}
        />
        <div>
          <label className="block text-text-secondary text-sm font-semibold mb-2">
            Game Type
          </label>
          <select
            className="w-full bg-primary-bg border border-dark rounded-xl px-4 py-3 focus:border-accent-yellow focus:outline-none"
            {...register('gameType')}
          >
            <option>Texas Hold&apos;em</option>
            <option>Omaha 4</option>
            <option>Omaha 6</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          id="buyin"
          label="Buy-in ($)"
          type="number"
          error={errors.buyin?.message}
          {...register('buyin', { valueAsNumber: true })}
        />
        <Input
          id="fee"
          label="Fee ($)"
          type="number"
          error={errors.fee?.message}
          {...register('fee', { valueAsNumber: true })}
        />
        <Input
          id="prizePool"
          label="Prize Pool ($)"
          type="number"
          error={errors.prizePool?.message}
          {...register('prizePool', { valueAsNumber: true })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          id="date"
          label="Start Date"
          type="date"
          error={errors.date?.message}
          {...register('date')}
        />
        <Input
          id="time"
          label="Start Time"
          type="time"
          error={errors.time?.message}
          {...register('time')}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-text-secondary text-sm font-semibold mb-2">
            Format
          </label>
          <select
            className="w-full bg-primary-bg border border-dark rounded-xl px-4 py-3 focus:border-accent-yellow focus:outline-none"
            {...register('format')}
          >
            <option>Regular</option>
            <option>Turbo</option>
            <option>Deepstack</option>
            <option>Bounty</option>
            <option>Freeroll</option>
          </select>
        </div>
        <Input
          id="seatCap"
          label="Seat Cap"
          type="number"
          placeholder="Optional"
          error={errors.seatCap?.message as string | undefined}
          value={seatCap ?? ''}
          onChange={(e) =>
            setValue(
              'seatCap',
              e.currentTarget.value === '' ? '' : Number(e.currentTarget.value),
            )
          }
        />
      </div>

      {includeDescription && (
        <div>
          <label className="block text-text-secondary text-sm font-semibold mb-2">
            Description / Rules
          </label>
          <textarea
            rows={3}
            placeholder="Optional"
            className="w-full bg-primary-bg border border-dark rounded-xl px-4 py-3 focus:border-accent-yellow focus:outline-none resize-none"
            {...register('description')}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('rebuy')} />
            <span>Rebuy Enabled</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('addon')} />
            <span>Add-on Enabled</span>
          </label>
        </div>

        {includeStatus ? (
          <div>
            <label className="block text-text-secondary text-sm font-semibold mb-2">
              Status
            </label>
            <select
              className="w-full bg-primary-bg border border-dark rounded-xl px-4 py-3 focus:border-accent-yellow focus:outline-none"
              {...register('status')}
            >
              <option value="scheduled">Scheduled</option>
              <option value="running">Running</option>
              <option value="finished">Finished</option>
            </select>
          </div>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
