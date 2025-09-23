'use client';

import { FormEvent, useRef, useState } from 'react';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import useToasts from '@/hooks/useToasts';
import ToastNotification from '@/app/components/ui/ToastNotification';
import Button from '@/app/components/ui/Button';
import { reconcileDeposits } from '@/lib/api/wallet';
import type { BankReconciliationEntry } from '@shared/wallet.schema';

interface ManualEntry {
  id: number;
  reference: string;
  amount: string;
}

type EntryErrors = Record<
  ManualEntry['id'],
  Partial<Record<'reference' | 'amount', string>>
>;

function createEntry(id: number): ManualEntry {
  return { id, reference: '', amount: '' };
}

export default function AdminBankReconciliation() {
  useRequireAdmin();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);
  const [file, setFile] = useState<File | null>(null);
  const [entries, setEntries] = useState<ManualEntry[]>([createEntry(0)]);
  const [entryErrors, setEntryErrors] = useState<EntryErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toasts, pushToast } = useToasts();

  const handleEntryChange = (
    id: number,
    field: 'reference' | 'amount',
    value: string,
  ) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry,
      ),
    );
    setEntryErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      const { [field]: _removed, ...rest } = next[id] ?? {};
      if (Object.keys(rest).length === 0) {
        delete next[id];
      } else {
        next[id] = rest;
      }
      return next;
    });
    setFormError(null);
  };

  const addEntry = () => {
    setEntries((prev) => [...prev, createEntry(nextId.current++)]);
    setFormError(null);
  };

  const removeEntry = (id: number) => {
    setEntries((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((entry) => entry.id !== id);
    });
    setEntryErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setEntries([createEntry(0)]);
    nextId.current = 1;
    setEntryErrors({});
    setFormError(null);
    clearFile();
  };

  const handleFileChange = (event: FormEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const [selected] = input.files ?? [];
    setFile(selected ?? null);
    setFormError(null);
    setEntryErrors({});
  };

  const submitManualEntries = async () => {
    const trimmed = entries.map((entry) => ({
      ...entry,
      reference: entry.reference.trim(),
      amount: entry.amount.trim(),
    }));
    setEntries(trimmed);

    const filled = trimmed.filter(
      (entry) => entry.reference !== '' || entry.amount !== '',
    );

    if (filled.length === 0) {
      setFormError('Add at least one entry or upload a CSV file.');
      return;
    }

    const issues: EntryErrors = {};
    const normalized: BankReconciliationEntry[] = [];

    filled.forEach((entry) => {
      const fieldErrors: Partial<Record<'reference' | 'amount', string>> = {};
      if (!entry.reference) {
        fieldErrors.reference = 'Reference is required';
      }
      if (!entry.amount) {
        fieldErrors.amount = 'Amount is required';
      }

      const parsedAmount = Number(entry.amount);
      if (!fieldErrors.amount) {
        if (!Number.isFinite(parsedAmount)) {
          fieldErrors.amount = 'Enter a valid amount in cents';
        } else if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
          fieldErrors.amount = 'Amount must be a positive integer';
        }
      }

      if (Object.keys(fieldErrors).length) {
        issues[entry.id] = fieldErrors;
        return;
      }

      normalized.push({
        reference: entry.reference,
        amount: parsedAmount,
      });
    });

    if (Object.keys(issues).length) {
      setEntryErrors(issues);
      setFormError('Fix highlighted fields before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await reconcileDeposits({ entries: normalized });
      pushToast(response.message ?? 'Reconciliation submitted', {
        variant: 'success',
      });
      resetForm();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unexpected error occurred';
      const friendly = `Failed to reconcile deposits: ${message}`;
      setFormError(friendly);
      pushToast(friendly, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setEntryErrors({});

    if (file) {
      try {
        setSubmitting(true);
        const response = await reconcileDeposits({ file });
        pushToast(response.message ?? 'Reconciliation submitted', {
          variant: 'success',
        });
        resetForm();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unexpected error occurred';
        const friendly = `Failed to reconcile deposits: ${message}`;
        setFormError(friendly);
        pushToast(friendly, { variant: 'error' });
      } finally {
        setSubmitting(false);
      }
      return;
    }

    await submitManualEntries();
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Bank Reconciliation</h1>
        <p className="text-text-secondary text-sm">
          Upload a CSV exported from your bank or enter deposits manually to
          confirm the ledger matches incoming transfers.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
        encType="multipart/form-data"
        noValidate
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-dark bg-card-bg p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Upload CSV</h2>
              <p className="text-sm text-text-secondary">
                The file must include <code>reference</code> and{' '}
                <code>amount</code> columns. Amounts should be provided in
                cents.
              </p>
            </div>
            <div className="space-y-3">
              <label
                htmlFor="reconcile-file"
                className="block text-sm font-medium"
              >
                CSV file
              </label>
              <input
                id="reconcile-file"
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="block w-full rounded-xl border border-dark bg-primary-bg px-3 py-2 text-sm file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-accent-yellow file:px-4 file:py-2 file:font-semibold file:text-black"
              />
              {file ? (
                <div className="flex items-center justify-between text-sm text-text-secondary">
                  <span>Selected: {file.name}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      clearFile();
                      setFormError(null);
                    }}
                  >
                    Clear file
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-text-secondary">No file selected.</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-dark bg-card-bg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Manual entries</h2>
                <p className="text-sm text-text-secondary">
                  Provide the deposit reference and amount in cents. Leave the
                  CSV empty if you reconcile manually.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={addEntry}
              >
                Add entry
              </Button>
            </div>

            <div className="space-y-4">
              {entries.map((entry, index) => {
                const referenceId = `recon-reference-${entry.id}`;
                const amountId = `recon-amount-${entry.id}`;
                const errors = entryErrors[entry.id] ?? {};

                return (
                  <div
                    key={entry.id}
                    className="space-y-3 rounded-2xl border border-dark bg-primary-bg p-4"
                  >
                    <div className="flex items-center justify-between text-sm font-semibold">
                      <span>Entry {index + 1}</span>
                      {entries.length > 1 ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeEntry(entry.id)}
                        >
                          Remove
                        </Button>
                      ) : null}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label
                        className="space-y-1 text-sm font-medium"
                        htmlFor={referenceId}
                      >
                        Deposit reference
                        <input
                          id={referenceId}
                          value={entry.reference}
                          onChange={(event) =>
                            handleEntryChange(
                              entry.id,
                              'reference',
                              event.target.value,
                            )
                          }
                          className="w-full rounded-xl border border-dark bg-card-bg px-3 py-2 text-sm focus:border-accent-yellow focus:outline-none"
                        />
                        {errors.reference ? (
                          <span className="text-xs text-danger-red">
                            {errors.reference}
                          </span>
                        ) : null}
                      </label>
                      <label
                        className="space-y-1 text-sm font-medium"
                        htmlFor={amountId}
                      >
                        Amount (cents)
                        <input
                          id={amountId}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={entry.amount}
                          onChange={(event) =>
                            handleEntryChange(
                              entry.id,
                              'amount',
                              event.target.value,
                            )
                          }
                          className="w-full rounded-xl border border-dark bg-card-bg px-3 py-2 text-sm focus:border-accent-yellow focus:outline-none"
                        />
                        {errors.amount ? (
                          <span className="text-xs text-danger-red">
                            {errors.amount}
                          </span>
                        ) : null}
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {formError ? (
          <div
            role="alert"
            className="rounded-2xl border border-danger-red bg-danger-red/10 px-4 py-3 text-sm text-danger-red"
          >
            {formError}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            disabled={submitting}
          >
            {submitting ? 'Reconciling…' : 'Submit reconciliation'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={submitting}
            onClick={resetForm}
          >
            Reset form
          </Button>
        </div>
      </form>

      {toasts.map((toast) => (
        <ToastNotification
          key={toast.id}
          message={toast.message}
          type={toast.variant === 'error' ? 'error' : 'success'}
          isOpen
          duration={toast.duration}
          onClose={() => {}}
        />
      ))}
    </div>
  );
}
