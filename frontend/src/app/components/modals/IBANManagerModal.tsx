'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Modal from '../ui/Modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

type IbanHistory = {
  date: string;
  oldIban: string;
  newIban: string;
  by: string;
  notes: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  currentIbanMasked: string;
  currentIbanFull: string;
  masked: boolean;
  holder: string;
  instructions: string;
  onToggleMask: () => void;
  onUpdate: (iban: string, holder: string, notes: string) => void;
  history: IbanHistory[];
  onReuse: (iban: string) => void;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
};

const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/;

const schema = z.object({
  iban: z
    .string()
    .trim()
    .min(1, 'IBAN is required')
    .refine((val) => ibanRegex.test(val.replace(/\s/g, '')), {
      message: 'Invalid IBAN',
    }),
  name: z.string().trim().min(1, 'Account holder name is required'),
  notes: z.string().trim().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function IBANManagerModal({
  open,
  onClose,
  currentIbanMasked,
  currentIbanFull,
  masked,
  holder,
  instructions,
  onToggleMask,
  onUpdate,
  history,
  onReuse,
  lastUpdatedBy,
  lastUpdatedAt,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { iban: '', name: '', notes: '' },
  });

  const submit = handleSubmit((data) => {
    onUpdate(data.iban.trim(), data.name.trim(), data.notes?.trim() || '');
    reset();
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={open} onClose={handleClose}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">Deposit IBAN Manager</h3>
        <button
          onClick={handleClose}
          className="text-text-secondary hover:text-text-primary"
        >
          ✕
        </button>
      </div>

      {/* Current IBAN */}
      <div className="bg-primary-bg p-4 rounded-2xl mb-6">
        <h4 className="font-semibold mb-3 text-accent-yellow">
          Current Active IBAN
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-text-secondary text-sm">IBAN</label>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-sm">
                {masked ? currentIbanMasked : currentIbanFull}
              </span>
              <button
                onClick={onToggleMask}
                className="text-accent-blue hover:brightness-110"
              >
                <FontAwesomeIcon icon={masked ? faEye : faEyeSlash} />
              </button>
            </div>
          </div>
          <div>
            <label className="text-text-secondary text-sm">
              Account Holder
            </label>
            <div className="mt-1">{holder}</div>
          </div>
          <div className="md:col-span-2">
            <label className="text-text-secondary text-sm">
              Deposit Instructions
            </label>
            <div className="mt-1 text-sm">
              {instructions || 'No special instructions'}
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="text-text-secondary text-sm">Last Updated</label>
            <div className="mt-1 text-xs text-text-secondary">
              By {lastUpdatedBy} on {lastUpdatedAt}
            </div>
          </div>
        </div>
      </div>

      {/* Update */}
      <div className="bg-primary-bg p-4 rounded-2xl mb-6">
        <h4 className="font-semibold mb-3 text-accent-green">
          Update IBAN Details
        </h4>
        <div className="space-y-4">
          <div>
            <label className="text-text-secondary text-sm block mb-2">
              New IBAN *
            </label>
            <input
              {...register('iban')}
              placeholder="DE02 5001 0517 5407 4100 72"
              className="w-full bg-card-bg border border-dark rounded-2xl px-3 py-3 text-sm font-mono"
            />
            {errors.iban && (
              <p className="text-red-500 text-sm mt-1">{errors.iban.message}</p>
            )}
          </div>
          <div>
            <label className="text-text-secondary text-sm block mb-2">
              Account Holder Name *
            </label>
            <input
              {...register('name')}
              placeholder="PokerPro Gaming Ltd."
              className="w-full bg-card-bg border border-dark rounded-2xl px-3 py-3 text-sm"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="text-text-secondary text-sm block mb-2">
              Deposit Instructions
            </label>
            <textarea
              {...register('notes')}
              placeholder="Include reference number, transfer within time limit, etc."
              className="w-full bg-card-bg border border-dark rounded-2xl px-3 py-3 text-sm h-20 resize-none"
            />
            {errors.notes && (
              <p className="text-red-500 text-sm mt-1">
                {errors.notes.message}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={submit}
              className="bg-accent-green hover:brightness-110 px-6 py-2 rounded-2xl font-semibold"
            >
              Update IBAN
            </button>
            <button
              onClick={() => reset()}
              className="bg-hover-bg hover:bg-gray-600 px-6 py-2 rounded-2xl font-semibold"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="bg-primary-bg p-4 rounded-2xl">
        <h4 className="font-semibold mb-3 text-accent-blue">Change History</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark">
                <th className="text-left py-2 px-2 text-text-secondary">
                  Date
                </th>
                <th className="text-left py-2 px-2 text-text-secondary">
                  Old IBAN
                </th>
                <th className="text-left py-2 px-2 text-text-secondary">
                  New IBAN
                </th>
                <th className="text-left py-2 px-2 text-text-secondary">
                  Updated By
                </th>
                <th className="text-left py-2 px-2 text-text-secondary">
                  Notes
                </th>
                <th className="text-left py-2 px-2 text-text-secondary">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i} className="border-b border-dark hover:bg-hover-bg">
                  <td className="py-2 px-2 text-text-secondary">{h.date}</td>
                  <td className="py-2 px-2 font-mono text-xs">{h.oldIban}</td>
                  <td className="py-2 px-2 font-mono text-xs">{h.newIban}</td>
                  <td className="py-2 px-2">{h.by}</td>
                  <td className="py-2 px-2 text-text-secondary">{h.notes}</td>
                  <td className="py-2 px-2">
                    <button
                      onClick={() => onReuse(h.newIban)}
                      className="bg-accent-yellow text-black px-2 py-1 rounded text-xs font-semibold hover:brightness-110"
                    >
                      Reuse
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}
