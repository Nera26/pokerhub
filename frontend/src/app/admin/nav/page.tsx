'use client';

import { useCallback } from 'react';
import {
  fetchNavItems,
  createNavItem,
  updateNavItem,
  deleteNavItem,
  type NavItem as UiNavItem,
} from '@/lib/api/nav';
import type { NavItemRequest } from '@shared/types';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import { useSimpleCrudPage } from '../useSimpleCrudPage';

type FormState = {
  flag: string;
  href: string;
  label: string;
  icon: string;
  order: string;
};

const EMPTY_FORM: FormState = {
  flag: '',
  href: '',
  label: '',
  icon: '',
  order: '1',
};

function normalizeError(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error';
}

const formFromNavItem = (item: UiNavItem): FormState => ({
  flag: item.flag,
  href: item.href,
  label: item.label,
  icon: item.iconName ?? '',
  order: String(item.order),
});

const computeNavDefaults = (items: UiNavItem[]): Partial<FormState> => {
  if (!items.length) {
    return { order: '1' };
  }
  const last = items[items.length - 1];
  return { order: String(last.order + 1) };
};

export default function NavAdminPage() {
  useRequireAdmin();
  const getItemId = useCallback((item: UiNavItem) => item.flag, []);
  const prepareSubmit = useCallback(
    (
      formState: FormState,
      { editingItem }: { editingItem: UiNavItem | null },
    ) => {
      const trimmedFlag = formState.flag.trim();
      const trimmedHref = formState.href.trim();
      const trimmedLabel = formState.label.trim();
      const trimmedIcon = formState.icon.trim();
      const parsedOrder = Number(formState.order);

      if (!Number.isInteger(parsedOrder)) {
        return { error: 'Order must be an integer' } as const;
      }

      if (!trimmedFlag || !trimmedHref || !trimmedLabel) {
        return { error: 'Flag, href, and label are required' } as const;
      }

      const payload: NavItemRequest = {
        flag: trimmedFlag,
        href: trimmedHref,
        label: trimmedLabel,
        order: parsedOrder,
        ...(trimmedIcon ? { icon: trimmedIcon } : {}),
      };

      if (editingItem) {
        return { type: 'update', payload } as const;
      }

      return { type: 'create', payload } as const;
    },
    [],
  );

  const formatListError = useCallback((error: unknown) => {
    return `Failed to load navigation items: ${normalizeError(error)}`;
  }, []);

  const formatActionError = useCallback(
    (action: 'create' | 'update' | 'delete', error: unknown) => {
      const message = normalizeError(error);
      const verb =
        action === 'delete'
          ? 'delete'
          : action === 'update'
            ? 'update'
            : 'create';
      return `Failed to ${verb} nav item: ${message}`;
    },
    [],
  );

  const {
    items,
    loading,
    listError,
    actionError,
    form,
    isEditing,
    submitting,
    deletingId,
    setFormValue,
    handleSubmit,
    handleDelete,
    startEdit,
    cancelEdit,
  } = useSimpleCrudPage<UiNavItem, FormState, NavItemRequest>({
    emptyForm: EMPTY_FORM,
    fetchItems: fetchNavItems,
    createItem: createNavItem,
    updateItem: updateNavItem,
    deleteItem: deleteNavItem,
    getItemId,
    formFromItem: formFromNavItem,
    prepareSubmit,
    computeInitialForm: computeNavDefaults,
    formatListError,
    formatActionError,
  });

  const error = actionError ?? listError;

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold">Navigation Items</h1>
      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-400 p-2 text-red-600"
        >
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
        <div className="space-y-1">
          <label className="block text-sm font-medium" htmlFor="flag">
            Flag
          </label>
          <input
            id="flag"
            name="flag"
            className="w-full rounded border border-gray-300 px-3 py-2"
            value={form.flag}
            onChange={(e) => setFormValue('flag', e.target.value)}
            readOnly={isEditing}
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium" htmlFor="href">
            Href
          </label>
          <input
            id="href"
            name="href"
            className="w-full rounded border border-gray-300 px-3 py-2"
            value={form.href}
            onChange={(e) => setFormValue('href', e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium" htmlFor="label">
            Label
          </label>
          <input
            id="label"
            name="label"
            className="w-full rounded border border-gray-300 px-3 py-2"
            value={form.label}
            onChange={(e) => setFormValue('label', e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium" htmlFor="icon">
            Icon (optional)
          </label>
          <input
            id="icon"
            name="icon"
            className="w-full rounded border border-gray-300 px-3 py-2"
            value={form.icon}
            onChange={(e) => setFormValue('icon', e.target.value)}
            placeholder="Icon name"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium" htmlFor="order">
            Order
          </label>
          <input
            id="order"
            name="order"
            type="number"
            className="w-full rounded border border-gray-300 px-3 py-2"
            value={form.order}
            onChange={(e) => setFormValue('order', e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {isEditing ? 'Update item' : 'Create item'}
          </button>
          {isEditing && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={cancelEdit}
              disabled={submitting}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
      <section>
        <h2 className="text-lg font-semibold mb-2">Existing items</h2>
        {loading ? (
          <p>Loading navigation items…</p>
        ) : items.length === 0 ? (
          <p>No navigation items found.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.flag}
                className="flex items-center justify-between rounded border border-gray-300 px-3 py-2"
              >
                <div className="flex flex-col">
                  <span className="font-medium">
                    {item.label}{' '}
                    <span className="text-xs text-gray-500">({item.flag})</span>
                  </span>
                  <span className="text-sm text-gray-600">
                    {item.href} · Order {item.order}
                  </span>
                  {item.iconName && (
                    <span className="text-xs text-gray-500">
                      Icon: {item.iconName}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="text-blue-600 underline"
                    onClick={() => startEdit(item)}
                    disabled={submitting}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-red-600 underline"
                    onClick={() => handleDelete(item.flag)}
                    disabled={submitting || deletingId === item.flag}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
