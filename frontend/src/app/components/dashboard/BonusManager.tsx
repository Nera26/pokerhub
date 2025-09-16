'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import { useTranslations } from '@/hooks/useTranslations';
import {
  fetchBonuses,
  createBonus,
  updateBonus,
  deleteBonus,
  type Bonus,
} from '@/lib/api/admin';
import { fetchBonusDefaults } from '@/lib/api/bonus';
import { useInvalidateMutation } from '@/hooks/useInvalidateMutation';
import type { ApiError } from '@/lib/api/client';
import type { BonusDefaultsResponse } from '@shared/types';
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
import Modal from '../ui/Modal';
import ToastNotification from '../ui/ToastNotification';
import Tooltip from '../ui/Tooltip';
import BonusForm from './forms/BonusForm';
import StatusModal from './StatusModal';
import StatusPill from './common/StatusPill';
import AdminTableManager from './common/AdminTableManager';
import { TableHead, TableRow, TableCell } from '../ui/Table';

type BonusStatus = 'active' | 'paused';
type StatusFilter = BonusStatus | 'all' | 'expired';
type PromoType = string;

export const bonusStyles: Record<BonusStatus | 'expired', string> = {
  active: 'bg-accent-green text-white',
  paused: 'bg-text-secondary text-black',
  expired: 'bg-text-secondary text-black',
};

const bonusFormSchema = z.object({
  name: z.string().min(1, 'Promotion name is required'),
  type: z.string(),
  description: z.string().min(1, 'Description is required'),
  bonusPercent: z.coerce.number().optional(),
  maxBonusUsd: z.coerce.number().optional(),
  expiryDate: z.string().optional(),
  eligibility: z.string(),
  status: z.string(),
});
export type BonusFormValues = z.infer<typeof bonusFormSchema>;

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
  const locale = useLocale();
  const { data: t } = useTranslations(locale);
  const {
    data: bonuses = [],
    isLoading,
    error,
  } = useQuery<Bonus[], ApiError>({
    queryKey: ['admin-bonuses'],
    queryFn: ({ signal }) => fetchBonuses({ signal }),
  });
  const {
    data: bonusDefaults,
    isLoading: defaultsLoading,
    error: defaultsError,
  } = useQuery<BonusDefaultsResponse, ApiError>({
    queryKey: ['admin-bonus-defaults'],
    queryFn: ({ signal }) => fetchBonusDefaults({ signal }),
  });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
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
    defaultValues: bonusDefaults ?? undefined,
  });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<BonusFormValues>({
    resolver: zodResolver(bonusFormSchema),
    defaultValues: bonusDefaults ?? undefined,
  });

  useEffect(() => {
    if (bonusDefaults) {
      resetCreate(bonusDefaults);
    }
  }, [bonusDefaults, resetCreate]);

  const [toast, setToast] = useState<{
    open: boolean;
    msg: string;
    type: 'success' | 'error';
  }>({
    open: false,
    msg: '',
    type: 'success',
  });

  const createMutation = useInvalidateMutation({
    mutationFn: createBonus,
    queryKey: ['admin-bonuses'],
    update: (previous, newBonus) => {
      const optimistic: Bonus = {
        ...newBonus,
        id: Date.now(),
        claimsTotal: 0,
        claimsWeek: 0,
      } as Bonus;
      return [optimistic, ...previous];
    },
    toastOpts: {
      success: 'Promotion created',
      error: 'Failed to create bonus',
      setToast,
    },
  });

  const updateMutation = useInvalidateMutation<{
    id: number;
    data: Partial<Bonus>;
  }>({
    mutationFn: ({ id, data }) => updateBonus(id, data),
    queryKey: ['admin-bonuses'],
    update: (previous, { id, data }) =>
      previous.map((b) => (b.id === id ? { ...b, ...data } : b)),
    toastOpts: {
      success: 'Changes saved',
      error: 'Failed to update bonus',
      setToast,
    },
  });

  const deleteMutation = useInvalidateMutation<number>({
    mutationFn: deleteBonus,
    queryKey: ['admin-bonuses'],
    update: (previous, id) => previous.filter((b) => b.id !== id),
    toastOpts: {
      success: 'Deleted bonus',
      error: 'Failed to delete bonus',
      setToast,
    },
  });

  const toggleMutation = useInvalidateMutation<{
    id: number;
    status: BonusStatus;
    name: string;
  }>({
    mutationFn: ({ id, status }) => updateBonus(id, { status }),
    queryKey: ['admin-bonuses'],
    update: (previous, { id, status }) =>
      previous.map((b) => (b.id === id ? { ...b, status } : b)),
    toastOpts: {
      success: ({ status, name }) =>
        status === 'paused' ? `Paused "${name}"` : `Resumed "${name}"`,
      error: 'Failed to update bonus',
      setToast,
    },
  });

  const filteredByStatus = useMemo(() => {
    return bonuses.filter((b) => {
      const expired = isExpired(b.expiryDate);
      return statusFilter === 'all'
        ? true
        : statusFilter === 'expired'
          ? expired
          : b.status === statusFilter;
    });
  }, [bonuses, statusFilter]);

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

  const BonusStatusPill = ({ b }: { b: Bonus }) => {
    const expired = isExpired(b.expiryDate);
    const label = expired ? 'EXPIRED' : b.status.toUpperCase();
    const className = expired ? bonusStyles.expired : bonusStyles[b.status];
    return <StatusPill label={label} className={className} />;
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

  const BonusRow = ({ b }: { b: Bonus }) => (
    <TableRow key={b.id}>
      <TableCell>
        <div>
          <p className="font-semibold">{b.name}</p>
          <p className="text-text-secondary text-sm">{b.description}</p>
        </div>
      </TableCell>
      <TableCell>{b.type}</TableCell>
      <TableCell>{dateLabel(b.expiryDate)}</TableCell>
      <TableCell className="text-accent-yellow">
        {b.claimsTotal.toLocaleString()}
      </TableCell>
      <TableCell>
        <BonusStatusPill b={b} />
      </TableCell>
      <TableCell className="text-right">
        <StatusActions b={b} />
      </TableCell>
    </TableRow>
  );

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
            <h3 className="text-xl font-bold">Bonuses</h3>
            <div className="flex items-center gap-2">
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
              <span className="bg-accent-green px-3 py-1 rounded-lg text-sm font-semibold">
                {totalActive} Active
              </span>
            </div>
          </div>

          {isLoading ? (
            <p>Loading bonuses...</p>
          ) : error ? (
            <p role="alert">{error.message}</p>
          ) : (
            <AdminTableManager
              items={filteredByStatus}
              header={
                <TableRow>
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Expiry Date</TableHead>
                  <TableHead className="font-semibold">Claims</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right font-semibold">
                    Actions
                  </TableHead>
                </TableRow>
              }
              renderRow={(b) => <BonusRow b={b} />}
              searchFilter={(b, q) => {
                const t = (
                  b.name +
                  ' ' +
                  b.description +
                  ' ' +
                  b.type
                ).toLowerCase();
                return !q || t.includes(q);
              }}
              searchPlaceholder={t?.searchPromotions ?? 'Search promotions...'}
              emptyMessage={
                t?.noPromotionsMatchFilters ??
                'No promotions match your filters.'
              }
              caption="Admin view of bonuses"
            />
          )}
        </section>

        <section className="space-y-6">
          <h3 className="text-xl font-bold">Create New Promotion</h3>

          <Card className="border border-dark">
            <CardContent>
              {defaultsError && (
                <p role="alert" className="mb-4 text-sm text-danger-red">
                  {defaultsError.message ?? 'Failed to load bonus defaults'}
                </p>
              )}

              {defaultsLoading && !bonusDefaults ? (
                <p>Loading bonus defaults...</p>
              ) : (
                <form className="space-y-6" onSubmit={createPromotion}>
                  <BonusForm
                    register={registerCreate}
                    errors={createErrors}
                    defaults={bonusDefaults ?? {}}
                    statusLabel="Initial Status"
                  />

                  <Button type="submit" className="w-full">
                    <FontAwesomeIcon icon={faPlus} />
                    CREATE PROMOTION
                  </Button>
                </form>
              )}
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
            <BonusForm
              register={registerEdit}
              errors={editErrors}
              defaults={{
                name: selected.name,
                type: selected.type,
                description: selected.description,
                bonusPercent: selected.bonusPercent,
                maxBonusUsd: selected.maxBonusUsd,
                expiryDate: selected.expiryDate ?? '',
                eligibility: selected.eligibility,
                status: selected.status,
              }}
            />

            <Button type="submit" className="w-full">
              <FontAwesomeIcon icon={faSave} />
              SAVE CHANGES
            </Button>
          </form>
        )}
      </Modal>

      {/* PAUSE/RESUME STATUS MODALS */}
      <StatusModal
        action="pause"
        isOpen={pauseOpen}
        onClose={() => setPauseOpen(false)}
        onConfirm={confirmPause}
        bonusName={selected?.name ?? ''}
      />
      <StatusModal
        action="resume"
        isOpen={resumeOpen}
        onClose={() => setResumeOpen(false)}
        onConfirm={confirmResume}
        bonusName={selected?.name ?? ''}
      />

      <ToastNotification
        message={toast.msg}
        type={toast.type}
        isOpen={toast.open}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </div>
  );
}
