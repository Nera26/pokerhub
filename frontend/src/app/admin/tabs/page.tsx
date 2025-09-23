'use client';

import { useCallback } from 'react';
import AdminCrudPage, {
  type AdminCrudField,
  type AdminCrudItemsRenderProps,
} from '@/app/components/dashboard/common/AdminCrudPage';
import {
  fetchAdminTabs,
  createAdminTab,
  updateAdminTab,
  deleteAdminTab,
} from '@/lib/api/admin';
import type {
  AdminTab,
  CreateAdminTabRequest,
  UpdateAdminTabRequest,
} from '@shared/types';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import type { SubmitPreparation } from '@/hooks/admin/useAdminCrud';

interface FormState {
  id: string;
  title: string;
  component: string;
  icon: string;
}

type UpdateInput = { id: string; payload: UpdateAdminTabRequest };

const EMPTY_FORM: FormState = {
  id: '',
  title: '',
  component: '',
  icon: '',
};

function normalizeError(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error';
}

const TAB_FIELDS: AdminCrudField<FormState>[] = [
  {
    name: 'id',
    label: 'ID',
    placeholder: 'analytics',
    readOnlyWhenEditing: true,
    wrapperClassName: 'flex flex-col text-sm font-medium',
    inputClassName: 'mt-1 rounded border border-gray-300 px-3 py-2',
  },
  {
    name: 'title',
    label: 'Title',
    placeholder: 'Analytics',
    wrapperClassName: 'flex flex-col text-sm font-medium',
    inputClassName: 'mt-1 rounded border border-gray-300 px-3 py-2',
  },
  {
    name: 'component',
    label: 'Component',
    placeholder: '@/app/components/dashboard/AdminAnalytics',
    wrapperClassName: 'flex flex-col text-sm font-medium',
    inputClassName: 'mt-1 rounded border border-gray-300 px-3 py-2',
  },
  {
    name: 'icon',
    label: 'Icon',
    placeholder: 'faChartLine',
    wrapperClassName: 'flex flex-col text-sm font-medium',
    inputClassName: 'mt-1 rounded border border-gray-300 px-3 py-2',
  },
];

export default function AdminTabsPage() {
  useRequireAdmin();
  const getItemId = useCallback((item: AdminTab) => item.id, []);
  const mapTabs = useCallback(
    (tabList: AdminTab[]) => tabList.filter((tab) => tab.source !== 'config'),
    [],
  );

  const formFromItem = useCallback(
    (tab: AdminTab): FormState => ({
      id: tab.id,
      title: tab.title ?? '',
      component: tab.component ?? '',
      icon: tab.icon ?? '',
    }),
    [],
  );

  const prepareSubmit = useCallback(
    (
      formState: FormState,
      { editingItem }: { editingItem: AdminTab | null },
    ): SubmitPreparation<CreateAdminTabRequest, UpdateInput, AdminTab> => {
      const trimmedId = formState.id.trim();
      const trimmedTitle = formState.title.trim();
      const trimmedComponent = formState.component.trim();
      const trimmedIcon = formState.icon.trim();

      if (!trimmedTitle || !trimmedComponent || (!editingItem && !trimmedId)) {
        return {
          error: 'ID, title, component, and icon are required',
        } as const;
      }

      if (!trimmedIcon) {
        return { error: 'Icon is required' } as const;
      }

      if (editingItem) {
        const payload: UpdateAdminTabRequest = {
          title: trimmedTitle,
          component: trimmedComponent,
          icon: trimmedIcon,
        };
        return {
          type: 'update',
          payload: {
            id: editingItem.id,
            payload,
          },
        } as const;
      }

      const payload: CreateAdminTabRequest = {
        id: trimmedId,
        title: trimmedTitle,
        component: trimmedComponent,
        icon: trimmedIcon,
      };

      return { type: 'create', payload } as const;
    },
    [],
  );

  const formatListError = useCallback((error: unknown) => {
    return `Failed to load admin tabs: ${normalizeError(error)}`;
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
      return `Failed to ${verb} admin tab: ${message}`;
    },
    [],
  );

  const renderTabs = ({
    items,
    loading,
    deletingId,
    submitting,
    startEdit,
    handleDelete,
  }: AdminCrudItemsRenderProps<AdminTab, string>) => (
    <section>
      <h2 className="text-lg font-semibold">Existing tabs</h2>
      {loading ? (
        <p>Loading admin tabs…</p>
      ) : items.length === 0 ? (
        <p>No runtime admin tabs found.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((tab) => (
            <li
              key={tab.id}
              className="flex items-center justify-between rounded border border-gray-200 px-3 py-2"
            >
              <div className="flex flex-col">
                <span className="font-semibold">{tab.title}</span>
                <span className="text-sm text-gray-600">{tab.id}</span>
                <span className="text-xs text-gray-500">
                  {tab.icon ? `Icon: ${tab.icon}` : 'Missing icon'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="text-blue-600 underline"
                  onClick={() => startEdit(tab)}
                  disabled={submitting || deletingId === tab.id}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="text-red-600 underline"
                  onClick={() => handleDelete(tab.id)}
                  disabled={deletingId === tab.id}
                >
                  {deletingId === tab.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <AdminCrudPage<
      AdminTab,
      CreateAdminTabRequest,
      UpdateInput,
      string,
      FormState
    >
      crudConfig={{
        queryKey: ['admin', 'tabs'],
        fetchItems: fetchAdminTabs,
        create: { mutationFn: createAdminTab },
        update: {
          mutationFn: (input) => updateAdminTab(input.id, input.payload),
        },
        remove: { mutationFn: deleteAdminTab },
        getItemId,
        transformItems: mapTabs,
        formatListError,
        formatActionError,
      }}
      formConfig={{
        title: 'Admin Tabs',
        emptyForm: EMPTY_FORM,
        fields: TAB_FIELDS,
        formFromItem,
        prepareSubmit,
        getItemId,
        createButtonLabel: 'Create tab',
        updateButtonLabel: 'Update tab',
        cancelButtonLabel: 'Cancel',
        formClassName: 'space-y-4 max-w-xl',
        fieldsWrapperClassName: 'grid gap-2 sm:grid-cols-2',
        submitButtonClassName:
          'rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50',
        cancelButtonClassName:
          'rounded border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-100 disabled:opacity-50',
        listErrorClassName: 'rounded-md border border-red-400 p-3 text-red-600',
        actionErrorClassName:
          'rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700',
        renderItems: renderTabs,
      }}
    />
  );
}
