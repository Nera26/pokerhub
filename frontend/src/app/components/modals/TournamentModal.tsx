'use client';

import { useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import InlineError from '../ui/InlineError';
import { CardTitle } from '../ui/Card';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSave } from '@fortawesome/free-solid-svg-icons';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type UseFormSetValue } from 'react-hook-form';
import { useGameTypes } from '@/hooks/useGameTypes';
import { useApiError } from '@/hooks/useApiError';
import { AdminTournamentSchema, type AdminTournament } from '@shared/types';

const tournamentSchema = AdminTournamentSchema.extend({
  name: z.string().min(1, 'Name is required'),
  gameType: z.string().min(1, 'Game type is required'),
  buyin: z.number().nonnegative('Buy-in must be at least 0'),
  fee: z.number().nonnegative('Fee must be at least 0'),
  prizePool: z.number().nonnegative('Prize pool must be at least 0'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
});

type Tournament = AdminTournament;

interface Props {
  isOpen: boolean;
  mode: 'create' | 'edit';
  onClose: () => void;
  onSubmit: (data: Tournament) => void;
  defaultValues?: Tournament;
}

export default function TournamentModal({
  isOpen,
  mode,
  onClose,
  onSubmit,
  defaultValues,
}: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<Tournament>({
    resolver: zodResolver(tournamentSchema),
    defaultValues,
  });

  const {
    data: gameTypes,
    isLoading: gameTypesLoading,
    error: gameTypesError,
  } = useGameTypes();
  const gameTypesErrorMessage = useApiError(gameTypesError);

  useEffect(() => {
    if (defaultValues) reset(defaultValues);
  }, [defaultValues, reset]);

  const seatCap = watch('seatCap');

  const submit = handleSubmit(onSubmit);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex items-center justify-between mb-6">
        <CardTitle>
          {mode === 'create' ? 'Create New Tournament' : 'Edit Tournament'}
        </CardTitle>
        <button
          onClick={onClose}
          className="text-text-secondary hover:text-white text-xl"
          aria-label="Close"
        >
          ×
        </button>
      </div>

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
            {gameTypesLoading ? (
              <p role="status">Loading game types...</p>
            ) : gameTypesErrorMessage ? (
              <InlineError message={gameTypesErrorMessage} />
            ) : gameTypes && gameTypes.length > 0 ? (
              <select
                className="w-full bg-primary-bg border border-dark rounded-xl px-4 py-3 focus:border-accent-yellow focus:outline-none"
                {...register('gameType')}
              >
                {gameTypes.map((g) => (
                  <option key={g.id} value={g.label}>
                    {g.label}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-text-secondary">No games available</p>
            )}
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
              (setValue as UseFormSetValue<Tournament>)(
                'seatCap',
                e.currentTarget.value === ''
                  ? ''
                  : Number(e.currentTarget.value),
              )
            }
          />
        </div>

        {mode === 'edit' && (
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

          {mode === 'edit' ? (
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

      <div className="flex justify-end gap-3 pt-4">
        <Button
          variant="ghost"
          onClick={onClose}
          className="border border-text-secondary"
        >
          Cancel
        </Button>
        <Button onClick={submit}>
          <FontAwesomeIcon
            icon={mode === 'create' ? faPlus : faSave}
            className="mr-2"
          />
          {mode === 'create' ? 'Create' : 'Save Changes'}
        </Button>
      </div>
    </Modal>
  );
}
