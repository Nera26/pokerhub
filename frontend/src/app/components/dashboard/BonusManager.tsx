'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import {
  fetchBonuses,
  createBonus,
  updateBonus,
  deleteBonus,
  type Bonus,
} from '@/lib/api/admin';
import useBonusMutation from '@/hooks/useBonusMutation';
import type { ApiError } from '@/lib/api/client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine,
  faEdit,
  faPause,
  faPlay,
  faPlus,
  faSave,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';

import Card, { CardContent, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import ToastNotification from '../ui/ToastNotification';
import Tooltip from '../ui/Tooltip';

type BonusStatus = 'active' | 'paused';
type StatusFilter = BonusStatus | 'all' | 'expired';
type PromoType = 'deposit' | 'rakeback' | 'ticket' | 'rebate' | 'first-deposit';

const bonusFormSchema = z.object({
  name: z.string().min(1, 'Promotion name is required'),
  type: z.enum(['deposit', 'rakeback', 'ticket', 'rebate', 'first-deposit']),
  description: z.string().min(1, 'Description is required'),
  bonusPercent: z.coerce.number().optional(),
  maxBonusUsd: z.coerce.number().optional(),
  expiryDate: z.string().optional(),
  eligibility: z.enum(['all', 'new', 'vip', 'active']),
  status: z.enum(['active', 'paused']),
});

type BonusFormValues = z.infer<typeof bonusFormSchema>;

function dateLabel(iso?: string) {
  if (!iso) return 'Ongoing';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}
function isExpired(iso?: string) {
  if (!iso) return false;
  const now = new Date();
  const end = new Date(iso + 'T23:59:59');
  return end.getTime() < now.getTime();
}

export default function BonusManager() {
  const {
    data: bonuses = [],
    isLoading,
    error,
  } = useQuery<Bonus[], ApiError>({
    queryKey: ['admin-bonuses'],
    queryFn: ({ signal }) => fetchBonuses({ signal }),
  });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [selected, setSelected] = useState<Bonus | null>(null);

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    reset: resetCreate,
    formState: { errors: createErrors },
  } = useForm<BonusFormValues>({
    resolver: zodResolver(bonusFormSchema),
    defaultValues: {
      name: '',
      type: 'deposit',
      description: '',
      bonusPercent: undefined,
      maxBonusUsd: undefined,
      expiryDate: '',
      eligibility: 'all',
      status: 'active',
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<BonusFormValues>({
    resolver: zodResolver(bonusFormSchema),
  });

  const [toast, setToast] = useState<{
    open: boolean;
    msg: string;
    type: 'success' | 'error';
  }>({
    open: false,
    msg: '',
    type: 'success',
  });

  const createMutation = useBonusMutation({
    mutationFn: createBonus,
    updateCache: (previous, newBonus) => {
      const optimistic: Bonus = {
        ...newBonus,
        id: Date.now(),
        claimsTotal: 0,
        claimsWeek: 0,
      } as Bonus;
      return [optimistic, ...previous];
    },
    successToast: 'Promotion created',
    errorToast: 'Failed to create bonus',
    setToast,
  });

  const updateMutation = useBonusMutation<{
    id: number;
    data: Partial<Bonus>;
  }>({
    mutationFn: ({ id, data }) => updateBonus(id, data),
    updateCache: (previous, { id, data }) =>
      previous.map((b) => (b.id === id ? { ...b, ...data } : b)),
    successToast: 'Changes saved',
    errorToast: 'Failed to update bonus',
    setToast,
  });

  const deleteMutation = useBonusMutation<number>({
    mutationFn: deleteBonus,
    updateCache: (previous, id) => previous.filter((b) => b.id !== id),
    successToast: 'Deleted bonus',
    errorToast: 'Failed to delete bonus',
    setToast,
  });

  const toggleMutation = useBonusMutation<{
    id: number;
    status: BonusStatus;
    name: string;
  }>({
    mutationFn: ({ id, status }) => updateBonus(id, { status }),
    updateCache: (previous, { id, status }) =>
      previous.map((b) => (b.id === id ? { ...b, status } : b)),
    successToast: ({ status, name }) =>
      status === 'paused' ? `Paused "${name}"` : `Resumed "${name}"`,
    errorToast: 'Failed to update bonus',
    setToast,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bonuses.filter((b) => {
      const t = (b.name + ' ' + b.description + ' ' + b.type).toLowerCase();
      const expired = isExpired(b.expiryDate);
      const passText = !q || t.includes(q);
      const passStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'expired'
            ? expired
            : b.status === statusFilter;
      return passText && passStatus;
    });
  }, [bonuses, search, statusFilter]);

  const totalActive = useMemo(
    () =>
      bonuses.filter((b) => b.status === 'active' && !isExpired(b.expiryDate))
        .length,
    [bonuses],
  );
  const claimsWeek = useMemo(
    () => bonuses.reduce((s, b) => s + (b.claimsWeek ?? 0), 0),
    [bonuses],
  );

  const openEdit = (b: Bonus) => {
    setSelected(b);
    resetEdit({
      name: b.name,
      type: b.type,
      description: b.description,
      bonusPercent: b.bonusPercent,
      maxBonusUsd: b.maxBonusUsd,
      expiryDate: b.expiryDate ?? '',
      eligibility: b.eligibility,
      status: b.status,
    });
    setEditOpen(true);
  };
  const openPause = (b: Bonus) => (setSelected(b), setPauseOpen(true));
  const openResume = (b: Bonus) => (setSelected(b), setResumeOpen(true));

  const saveEdit = handleEditSubmit((data) => {
    if (!selected) return;
    updateMutation.mutate({
      id: selected.id,
      data: { ...data, expiryDate: data.expiryDate || undefined },
    });
    setEditOpen(false);
  });
  const confirmPause = () => {
    if (!selected) return;
    toggleMutation.mutate({
      id: selected.id,
      status: 'paused',
      name: selected.name,
    });
    setPauseOpen(false);
  };
  const confirmResume = () => {
    if (!selected) return;
    toggleMutation.mutate({
      id: selected.id,
      status: 'active',
      name: selected.name,
    });
    setResumeOpen(false);
  };

  const createPromotion = handleCreateSubmit((data) => {
    createMutation.mutate({
      name: data.name || 'Untitled Promotion',
      type: data.type,
      description: data.description,
      bonusPercent: data.bonusPercent ?? undefined,
      maxBonusUsd: data.maxBonusUsd ?? undefined,
      expiryDate: data.expiryDate || undefined,
      eligibility: data.eligibility,
      status: data.status,
    });
    resetCreate();
  });

  const StatusPill = ({ b }: { b: Bonus }) => {
    const expired = isExpired(b.expiryDate);
    if (expired)
      return (
        <span className="bg-text-secondary text-black px-3 py-1 rounded-lg text-xs font-bold">
          EXPIRED
        </span>
      );
    if (b.status === 'active')
      return (
        <span className="bg-accent-green text-white px-3 py-1 rounded-lg text-xs font-bold">
          ACTIVE
        </span>
      );
    return (
      <span className="bg-text-secondary text-black px-3 py-1 rounded-lg text-xs font-bold">
        PAUSED
      </span>
    );
  };

  const StatusActions = ({ b }: { b: Bonus }) => {
    const expired = isExpired(b.expiryDate);
    return (
      <div className="grid grid-cols-2 gap-3">
        <Tooltip text="Edit">
          <Button
            variant="outline"
            onClick={() => openEdit(b)}
            className="w-full h-10"
            title="Edit promotion"
          >
            <FontAwesomeIcon icon={faEdit} />
            Edit
          </Button>
        </Tooltip>
        {!expired && b.status === 'active' && (
          <Tooltip text="Pause">
            <Button
              variant="danger"
              onClick={() => openPause(b)}
              className="w-full h-10"
              title="Pause promotion"
            >
              <FontAwesomeIcon icon={faPause} />
              Pause
            </Button>
          </Tooltip>
        )}
        {!expired && b.status === 'paused' && (
          <Tooltip text="Resume">
            <Button
              variant="primary"
              onClick={() => openResume(b)}
              className="w-full h-10"
              title="Resume promotion"
            >
              <FontAwesomeIcon icon={faPlay} />
              Resume
            </Button>
          </Tooltip>
        )}
        {expired && <div />} {/* keep grid aligned */}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <section className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bonus Manager</h2>
          <p className="text-text-secondary">
            Manage bonuses and promotional campaigns
          </p>
        </div>
        <div className="flex items-center gap-2 bg-primary-bg px-4 py-2 rounded-xl">
          <FontAwesomeIcon icon={faChartLine} className="text-accent-green" />
          <span className="font-semibold">
            Total Claims:{' '}
            {bonuses.reduce((s, b) => s + b.claimsTotal, 0).toLocaleString()}
          </span>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Active Bonuses</h3>
            <span className="bg-accent-green px-3 py-1 rounded-lg text-sm font-semibold">
              {totalActive} Active
            </span>
          </div>

          {isLoading ? (
            <p>Loading bonuses...</p>
          ) : error ? (
            <p role="alert">{error.message}</p>
          ) : filtered.length === 0 ? (
            <Card className="border border-dark">
              <CardContent>
                <p className="text-text-secondary">
                  No promotions match your filters.
                </p>
              </CardContent>
            </Card>
          ) : (
            filtered.map((b) => (
              <Card key={b.id} className="border border-dark">
                <CardContent>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-bold mb-2">{b.name}</h4>
                      <p className="text-text-secondary text-sm mb-3">
                        {b.description}
                      </p>
                    </div>
                    <StatusPill b={b} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-text-secondary text-xs">Expiry Date</p>
                      <p className="font-semibold">{dateLabel(b.expiryDate)}</p>
                    </div>
                    <div>
                      <p className="text-text-secondary text-xs">Total Claims</p>
                      <p className="font-semibold text-accent-yellow">
                        {b.claimsTotal.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <StatusActions b={b} />
                </CardContent>
              </Card>
            ))
          )}
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Create New Promotion</h3>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setStatusFilter(e.target.value as StatusFilter)
                }
                className="bg-primary-bg border border-dark rounded-xl px-3 py-2 text-sm text-text-primary focus:border-accent-yellow focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="expired">Expired</option>
              </select>
              <input
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearch(e.target.value)
                }
                type="text"
                placeholder="Search promotions..."
                className="bg-primary-bg border border-dark rounded-xl px-3 py-2 text-sm text-text-primary focus:border-accent-yellow focus:outline-none w-48"
              />
            </div>
          </div>

          <Card className="border border-dark">
            <CardContent>
              <form className="space-y-6" onSubmit={createPromotion}>
                <Input
                  label="Promotion Name"
                  placeholder="Enter promotion name..."
                  error={createErrors.name?.message}
                  {...registerCreate('name')}
                />

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Promotion Type
                  </label>
                  <select
                    className="w-full bg-primary-bg border border-dark rounded-xl px-4 py-3 text-text-primary focus:border-accent-yellow focus:outline-none"
                    {...registerCreate('type')}
                  >
                    <option value="deposit">Deposit Match</option>
                    <option value="rakeback">Rakeback</option>
                    <option value="ticket">Tournament Tickets</option>
                    <option value="rebate">Rebate</option>
                    <option value="first-deposit">First Deposit Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter promotion description..."
                    className="w-full bg-primary-bg border border-dark rounded-xl px-4 py-3 text-text-primary focus:border-accent-yellow focus:outline-none resize-none"
                    {...registerCreate('description')}
                  />
                  {createErrors.description && (
                    <p className="text-xs text-danger-red mt-1">
                      {createErrors.description.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Bonus Amount (%)"
                    type="number"
                    placeholder="0"
                    error={createErrors.bonusPercent?.message}
                    {...registerCreate('bonusPercent', { valueAsNumber: true })}
                  />
                  <Input
                    label="Max $"
                    type="number"
                    placeholder="0"
                    error={createErrors.maxBonusUsd?.message}
                    {...registerCreate('maxBonusUsd', { valueAsNumber: true })}
                  />
                </div>

                <Input
                  label="Expiry Date"
                  type="date"
                  error={createErrors.expiryDate?.message}
                  {...registerCreate('expiryDate')}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Player Eligibility
                    </label>
                    <select
                      className="w-full bg-primary-bg border border-dark rounded-xl px-4 py-3 text-text-primary focus:border-accent-yellow focus:outline-none"
                      {...registerCreate('eligibility')}
                    >
                      <option value="all">All Players</option>
                      <option value="new">New Players Only</option>
                      <option value="vip">VIP Players Only</option>
                      <option value="active">Active Players</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Initial Status
                    </label>
                    <select
                      className="w-full bg-primary-bg border border-dark rounded-xl px-4 py-3 text-text-primary focus:border-accent-yellow focus:outline-none"
                      {...registerCreate('status')}
                    >
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                    </select>
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  <FontAwesomeIcon icon={faPlus} />
                  CREATE PROMOTION
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border border-dark">
            <CardContent>
              <h4 className="text-lg font-bold mb-4">Promotion Statistics</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Total Active</span>
                  <span className="text-accent-green font-bold">
                    {totalActive}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Claims This Week</span>
                  <span className="text-accent-yellow font-bold">
                    {claimsWeek.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Total Payout</span>
                  <span className="font-bold">$12,847</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Conversion Rate</span>
                  <span className="text-accent-blue font-bold">23.4%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      {/* EDIT */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)}>
        <div className="flex justify-between items-center mb-6">
          <CardTitle>Edit Bonus</CardTitle>
          <button
            onClick={() => setEditOpen(false)}
            className="text-text-secondary hover:text-text-primary"
            aria-label="Close"
          >
            <FontAwesomeIcon icon={faTimes} className="text-xl" />
          </button>
        </div>

        {selected && (
          <form className="space-y-6" onSubmit={saveEdit}>
            <Input
              label="Promotion Name"
              error={editErrors.name?.message}
              {...registerEdit('name')}
            />

            <div>
              <label className="block text-sm font-semibold mb-2">Type</label>
              <select
                className="w-full bg-primary-bg border border-dark rounded-xl px-4 py-3 text-text-primary focus:border-accent-yellow focus:outline-none"
                {...registerEdit('type')}
              >
                <option value="deposit">Deposit Match</option>
                <option value="rakeback">Rakeback</option>
                <option value="ticket">Tournament Tickets</option>
                <option value="rebate">Rebate</option>
                <option value="first-deposit">First Deposit Only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Description
              </label>
              <textarea
                rows={3}
                className="w-full bg-primary-bg border border-dark rounded-xl px-4 py-3 text-text-primary focus:border-accent-yellow focus:outline-none resize-none"
                {...registerEdit('description')}
              />
              {editErrors.description && (
                <p className="text-xs text-danger-red mt-1">
                  {editErrors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Bonus Amount (%)"
                type="number"
                error={editErrors.bonusPercent?.message}
                {...registerEdit('bonusPercent', { valueAsNumber: true })}
              />
              <Input
                label="Max Bonus ($)"
                type="number"
                error={editErrors.maxBonusUsd?.message}
                {...registerEdit('maxBonusUsd', { valueAsNumber: true })}
              />
            </div>

            <Input
              label="Expiry Date"
              type="date"
              error={editErrors.expiryDate?.message}
              {...registerEdit('expiryDate')}
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Player Eligibility
                </label>
                <select
                  className="w-full bg-primary-bg border border-dark rounded-xl px-4 py-3 text-text-primary focus:border-accent-yellow focus:outline-none"
                  {...registerEdit('eligibility')}
                >
                  <option value="all">All Players</option>
                  <option value="new">New Players Only</option>
                  <option value="vip">VIP Players Only</option>
                  <option value="active">Active Players</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Status
                </label>
                <select
                  className="w-full bg-primary-bg border border-dark rounded-xl px-4 py-3 text-text-primary focus:border-accent-yellow focus:outline-none"
                  {...registerEdit('status')}
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
            </div>

            <Button type="submit" className="w-full">
              <FontAwesomeIcon icon={faSave} />
              SAVE CHANGES
            </Button>
          </form>
        )}
      </Modal>

      {/* PAUSE */}
      <Modal isOpen={pauseOpen} onClose={() => setPauseOpen(false)}>
        <div className="text-center">
          <FontAwesomeIcon
            icon={faPause}
            className="text-4xl text-danger-red mb-4"
          />
          <CardTitle>Pause Bonus</CardTitle>
          <p className="text-text-secondary mb-6">
            Are you sure you want to pause{' '}
            <span className="text-accent-yellow font-semibold">
              {selected?.name}
            </span>
            ?
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => setPauseOpen(false)}
              className="flex-1 border border-dark text-text-secondary hover:bg-hover-bg py-3 rounded-xl font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmPause}
              className="flex-1 bg-danger-red hover:brightness-110 py-3 rounded-xl font-semibold text-text-primary transition-colors"
            >
              Confirm Pause
            </button>
          </div>
        </div>
      </Modal>

      {/* RESUME */}
      <Modal isOpen={resumeOpen} onClose={() => setResumeOpen(false)}>
        <div className="text-center">
          <FontAwesomeIcon
            icon={faPlay}
            className="text-4xl text-accent-green mb-4"
          />
          <CardTitle>Resume Bonus</CardTitle>
          <p className="text-text-secondary mb-6">
            Are you sure you want to resume{' '}
            <span className="text-accent-yellow font-semibold">
              {selected?.name}
            </span>
            ?
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => setResumeOpen(false)}
              className="flex-1 border border-dark text-text-secondary hover:bg-hover-bg py-3 rounded-xl font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmResume}
              className="flex-1 bg-accent-green hover-glow-green py-3 rounded-xl font-semibold text-text-primary transition-colors"
            >
              Confirm Resume
            </button>
          </div>
        </div>
      </Modal>

      <ToastNotification
        message={toast.msg}
        type={toast.type}
        isOpen={toast.open}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </div>
  );
}
