'use client';

import { useState } from 'react';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import { useBlockedCountries } from '@/hooks/useBlockedCountries';
import {
  createBlockedCountry,
  updateBlockedCountry,
  deleteBlockedCountry,
} from '@/lib/api/blockedCountries';
import type { BlockedCountry } from '@shared/types';

export default function BlockedCountriesPage() {
  useRequireAdmin();

  const { data, isLoading, isError, error, refetch } = useBlockedCountries();
  const countries = data ?? [];

  const [input, setInput] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);

  const resetForm = () => {
    setInput('');
    setEditing(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = input.trim().toUpperCase();
    if (!value) return;

    const payload: BlockedCountry = { country: value };

    setIsSubmitting(true);
    setActionError(null);

    try {
      if (editing) {
        await updateBlockedCountry(editing, payload);
      } else {
        await createBlockedCountry(payload);
      }
      resetForm();
      await refetch();
    } catch {
      setActionError('Failed to save blocked country');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (code: string) => {
    setEditing(code);
    setInput(code);
    setActionError(null);
  };

  const cancelEdit = () => {
    resetForm();
    setActionError(null);
  };

  const handleDelete = async (code: string) => {
    setDeletingCode(code);
    setActionError(null);
    try {
      await deleteBlockedCountry(code);
      if (editing === code) {
        resetForm();
      }
      await refetch();
    } catch {
      setActionError('Failed to delete blocked country');
    } finally {
      setDeletingCode(null);
    }
  };

  if (isLoading) {
    return <div>Loading blocked countries...</div>;
  }

  if (isError) {
    return (
      <div role="alert">
        {error?.message ?? 'Failed to load blocked countries'}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-bold">Blocked Countries</h1>

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col text-sm font-semibold text-text-primary">
          Country code
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            placeholder="Country code"
            maxLength={2}
            className="mt-1 rounded-lg border border-border-dark bg-primary-bg px-3 py-2 uppercase"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-accent-yellow px-4 py-2 font-semibold text-black hover:brightness-110 disabled:opacity-50"
          disabled={isSubmitting}
        >
          {editing ? 'Update Country' : 'Add Country'}
        </button>
        {editing && (
          <button
            type="button"
            onClick={cancelEdit}
            className="rounded-lg border border-border-dark px-4 py-2 font-semibold hover:bg-hover-bg"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        )}
      </form>

      {actionError && (
        <div
          role="alert"
          className="rounded-lg border border-border-dark px-3 py-2 text-danger-red"
        >
          {actionError}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border-dark">
        <table className="min-w-full text-left">
          <thead className="bg-card-bg">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold">
                Country
              </th>
              <th className="px-4 py-2 text-left text-sm font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {countries.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  className="px-4 py-6 text-center text-sm text-text-secondary"
                >
                  No blocked countries
                </td>
              </tr>
            ) : (
              countries.map(({ country }) => (
                <tr key={country} className="border-t border-border-dark">
                  <td className="px-4 py-2 text-sm font-medium text-text-primary">
                    {country}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-border-dark px-3 py-1 font-semibold hover:bg-hover-bg"
                        onClick={() => startEdit(country)}
                        disabled={isSubmitting || deletingCode === country}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="rounded-lg bg-danger-red px-3 py-1 font-semibold text-white hover:brightness-110 disabled:opacity-50"
                        onClick={() => handleDelete(country)}
                        disabled={deletingCode === country}
                      >
                        {deletingCode === country ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
