'use client';

import { useCallback } from 'react';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import {
  fetchBlockedCountries,
  createBlockedCountry,
  updateBlockedCountry,
  deleteBlockedCountry,
} from '@/lib/api/blockedCountries';
import type { BlockedCountry } from '@shared/types';
import {
  AdminCrudPage,
  type AdminCrudField,
  type AdminCrudItemsRenderProps,
} from '../AdminCrudPage';
import type { SubmitPreparation } from '@/hooks/admin/useAdminCrud';

type FormState = {
  country: string;
};

type UpdateInput = { id: string; payload: BlockedCountry };

const EMPTY_FORM: FormState = {
  country: '',
};

const BLOCKED_COUNTRY_FIELDS: AdminCrudField<FormState>[] = [
  {
    name: 'country',
    label: 'Country code',
    placeholder: 'Country code',
    wrapperClassName: 'flex flex-col text-sm font-semibold text-text-primary',
    labelClassName: 'text-sm font-semibold text-text-primary',
    inputClassName:
      'mt-1 rounded-lg border border-border-dark bg-primary-bg px-3 py-2 uppercase',
    inputProps: { maxLength: 2 },
    transform: (value) => value.toUpperCase(),
  },
];

export default function BlockedCountriesPage() {
  useRequireAdmin();

  const getItemId = useCallback((item: BlockedCountry) => item.country, []);

  const formFromItem = useCallback(
    (country: BlockedCountry): FormState => ({
      country: country.country,
    }),
    [],
  );

  const prepareSubmit = useCallback(
    (
      formState: FormState,
      { editingItem }: { editingItem: BlockedCountry | null },
    ): SubmitPreparation<BlockedCountry, UpdateInput, BlockedCountry> => {
      const countryCode = formState.country.trim().toUpperCase();

      if (!countryCode) {
        return { error: 'Country code is required' } as const;
      }

      const payload: BlockedCountry = { country: countryCode };

      if (editingItem) {
        return {
          type: 'update',
          payload: {
            id: editingItem.country,
            payload,
          },
        } as const;
      }

      return { type: 'create', payload } as const;
    },
    [],
  );

  const formatListError = useCallback((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return `Failed to load blocked countries: ${message}`;
  }, []);

  const formatActionError = useCallback(
    (
      action: 'create' | 'update' | 'delete',
      error: unknown,
      _context: unknown,
    ) => {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (action === 'delete') {
        return `Failed to delete blocked country: ${message}`;
      }
      return `Failed to save blocked country: ${message}`;
    },
    [],
  );

  const renderItems = ({
    items,
    loading,
    deletingId,
    submitting,
    startEdit,
    handleDelete,
  }: AdminCrudItemsRenderProps<BlockedCountry, string>) => (
    <div className="overflow-x-auto rounded-xl border border-border-dark">
      {loading ? (
        <div className="px-4 py-6 text-center text-sm text-text-secondary">
          Loading blocked countries...
        </div>
      ) : (
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
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  className="px-4 py-6 text-center text-sm text-text-secondary"
                >
                  No blocked countries
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.country} className="border-t border-border-dark">
                  <td className="px-4 py-2 text-sm font-medium text-text-primary">
                    {item.country}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-border-dark px-3 py-1 font-semibold hover:bg-hover-bg"
                        onClick={() => startEdit(item)}
                        disabled={submitting || deletingId === item.country}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="rounded-lg bg-danger-red px-3 py-1 font-semibold text-white hover:brightness-110 disabled:opacity-50"
                        onClick={() => handleDelete(item.country)}
                        disabled={deletingId === item.country}
                      >
                        {deletingId === item.country ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <AdminCrudPage<
      BlockedCountry,
      FormState,
      BlockedCountry,
      UpdateInput,
      string
    >
      title="Blocked Countries"
      emptyForm={EMPTY_FORM}
      fields={BLOCKED_COUNTRY_FIELDS}
      fetchItems={fetchBlockedCountries}
      createItem={createBlockedCountry}
      updateItem={(input) => updateBlockedCountry(input.id, input.payload)}
      deleteItem={deleteBlockedCountry}
      getItemId={getItemId}
      formFromItem={formFromItem}
      prepareSubmit={prepareSubmit}
      formatListError={formatListError}
      formatActionError={formatActionError}
      createButtonLabel="Add Country"
      updateButtonLabel="Update Country"
      cancelButtonLabel="Cancel"
      containerClassName="space-y-4 p-4"
      formClassName="flex flex-wrap items-end gap-2"
      fieldsWrapperClassName="contents"
      actionsWrapperClassName="flex gap-2"
      submitButtonClassName="rounded-lg bg-accent-yellow px-4 py-2 font-semibold text-black hover:brightness-110 disabled:opacity-50"
      cancelButtonClassName="rounded-lg border border-border-dark px-4 py-2 font-semibold hover:bg-hover-bg disabled:opacity-50"
      listErrorClassName="rounded-lg border border-border-dark px-3 py-2 text-danger-red"
      actionErrorClassName="rounded-lg border border-border-dark px-3 py-2 text-danger-red"
      renderItems={renderItems}
    />
  );
}
