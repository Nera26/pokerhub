'use client';

import { useCallback } from 'react';
import AdminCrudPage, {
  type AdminCrudField,
  type AdminCrudItemsRenderProps,
} from '@/app/components/dashboard/common/AdminCrudPage';
import {
  fetchNavItems,
  createNavItem,
  updateNavItem,
  deleteNavItem,
  type NavItem as UiNavItem,
} from '@/lib/api/nav';
import type { NavItemRequest } from '@shared/types';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import type { SubmitPreparation } from '@/hooks/admin/useAdminCrud';

type FormState = {
  flag: string;
  href: string;
  label: string;
  icon: string;
  order: string;
};

type UpdateInput = { id: string; payload: NavItemRequest };

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

const NAV_FIELDS: AdminCrudField<FormState>[] = [
  {
    name: 'flag',
    label: 'Flag',
    readOnlyWhenEditing: true,
    wrapperClassName: 'space-y-1',
    labelClassName: 'block text-sm font-medium',
    inputClassName: 'w-full rounded border border-gray-300 px-3 py-2',
  },
  {
    name: 'href',
    label: 'Href',
    wrapperClassName: 'space-y-1',
    labelClassName: 'block text-sm font-medium',
    inputClassName: 'w-full rounded border border-gray-300 px-3 py-2',
  },
  {
    name: 'label',
    label: 'Label',
    wrapperClassName: 'space-y-1',
    labelClassName: 'block text-sm font-medium',
    inputClassName: 'w-full rounded border border-gray-300 px-3 py-2',
  },
  {
    name: 'icon',
    label: 'Icon (optional)',
    placeholder: 'Icon name',
    wrapperClassName: 'space-y-1',
    labelClassName: 'block text-sm font-medium',
    inputClassName: 'w-full rounded border border-gray-300 px-3 py-2',
  },
  {
    name: 'order',
    label: 'Order',
    inputType: 'number',
    wrapperClassName: 'space-y-1',
    labelClassName: 'block text-sm font-medium',
    inputClassName: 'w-full rounded border border-gray-300 px-3 py-2',
  },
];

export default function NavAdminPage() {
  useRequireAdmin();
  const getItemId = useCallback((item: UiNavItem) => item.flag, []);
  const prepareSubmit = useCallback(
    (
      formState: FormState,
      { editingItem }: { editingItem: UiNavItem | null },
    ): SubmitPreparation<NavItemRequest, UpdateInput, UiNavItem> => {
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
        return {
          type: 'update',
          payload: {
            id: editingItem.flag,
            payload,
          },
        } as const;
      }

      return { type: 'create', payload } as const;
    },
    [],
  );

  const formatListError = useCallback((error: unknown) => {
    return `Failed to load navigation items: ${normalizeError(error)}`;
  }, []);

  const formatActionError = useCallback(
    (
      action: 'create' | 'update' | 'delete',
      error: unknown,
      _context: unknown,
    ) => {
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

  const renderItems = ({
    items,
    loading,
    deletingId,
    submitting,
    startEdit,
    handleDelete,
  }: AdminCrudItemsRenderProps<UiNavItem, string>) => (
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
  );

  return (
    <AdminCrudPage<UiNavItem, NavItemRequest, UpdateInput, string, FormState>
      crudConfig={{
        queryKey: ['admin', 'nav'],
        fetchItems: fetchNavItems,
        create: { mutationFn: createNavItem },
        update: {
          mutationFn: (input) => updateNavItem(input.id, input.payload),
        },
        remove: { mutationFn: deleteNavItem },
        getItemId,
        formatListError,
        formatActionError,
      }}
      formConfig={{
        title: 'Navigation Items',
        emptyForm: EMPTY_FORM,
        fields: NAV_FIELDS,
        formFromItem: formFromNavItem,
        prepareSubmit,
        computeInitialForm: computeNavDefaults,
        getItemId,
        createButtonLabel: 'Create item',
        updateButtonLabel: 'Update item',
        cancelButtonLabel: 'Cancel',
        containerClassName: 'p-4 space-y-6',
        formClassName: 'space-y-3 max-w-md',
        fieldsWrapperClassName: 'space-y-3',
        submitButtonClassName: 'btn btn-primary',
        cancelButtonClassName: 'btn btn-secondary',
        listErrorClassName: 'rounded-md border border-red-400 p-2 text-red-600',
        actionErrorClassName:
          'rounded-md border border-red-400 p-2 text-red-600',
        renderItems,
      }}
    />
  );
}
