'use client';

import { useCallback } from 'react';
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
import { useSimpleCrudPage } from '../useSimpleCrudPage';

interface FormState {
  id: string;
  title: string;
  component: string;
  icon: string;
}

const EMPTY_FORM: FormState = {
  id: '',
  title: '',
  component: '',
  icon: '',
};

function normalizeError(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error';
}

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
    ) => {
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
        return { type: 'update', payload } as const;
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
    (action: 'create' | 'update' | 'delete', error: unknown) => {
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

  const {
    items: tabs,
    loading,
    listError: error,
    actionError: formError,
    form,
    isEditing,
    submitting,
    deletingId,
    setFormValue,
    handleSubmit,
    handleDelete,
    startEdit,
    cancelEdit,
  } = useSimpleCrudPage<
    AdminTab,
    FormState,
    CreateAdminTabRequest,
    UpdateAdminTabRequest
  >({
    emptyForm: EMPTY_FORM,
    fetchItems: fetchAdminTabs,
    createItem: createAdminTab,
    updateItem: updateAdminTab,
    deleteItem: deleteAdminTab,
    getItemId,
    mapItems: mapTabs,
    formFromItem,
    prepareSubmit,
    formatListError,
    formatActionError,
  });

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-xl font-bold">Admin Tabs</h1>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-400 p-3 text-red-600"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex flex-col text-sm font-medium" htmlFor="tab-id">
            ID
            <input
              id="tab-id"
              name="id"
              value={form.id}
              onChange={(event) => setFormValue('id', event.target.value)}
              className="mt-1 rounded border border-gray-300 px-3 py-2"
              placeholder="analytics"
              readOnly={isEditing}
            />
          </label>

          <label
            className="flex flex-col text-sm font-medium"
            htmlFor="tab-title"
          >
            Title
            <input
              id="tab-title"
              name="title"
              value={form.title}
              onChange={(event) => setFormValue('title', event.target.value)}
              className="mt-1 rounded border border-gray-300 px-3 py-2"
              placeholder="Analytics"
            />
          </label>

          <label
            className="flex flex-col text-sm font-medium"
            htmlFor="tab-component"
          >
            Component
            <input
              id="tab-component"
              name="component"
              value={form.component}
              onChange={(event) =>
                setFormValue('component', event.target.value)
              }
              className="mt-1 rounded border border-gray-300 px-3 py-2"
              placeholder="@/app/components/dashboard/AdminAnalytics"
            />
          </label>

          <label
            className="flex flex-col text-sm font-medium"
            htmlFor="tab-icon"
          >
            Icon
            <input
              id="tab-icon"
              name="icon"
              value={form.icon}
              onChange={(event) => setFormValue('icon', event.target.value)}
              className="mt-1 rounded border border-gray-300 px-3 py-2"
              placeholder="faChartLine"
            />
          </label>
        </div>

        {formError && (
          <div
            role="alert"
            className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700"
          >
            {formError}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            disabled={submitting}
          >
            {isEditing ? 'Update tab' : 'Create tab'}
          </button>
          {isEditing && (
            <button
              type="button"
              className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-100 disabled:opacity-50"
              onClick={cancelEdit}
              disabled={submitting}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <section>
        <h2 className="text-lg font-semibold">Existing tabs</h2>
        {loading ? (
          <p>Loading admin tabs…</p>
        ) : tabs.length === 0 ? (
          <p>No runtime admin tabs found.</p>
        ) : (
          <ul className="space-y-2">
            {tabs.map((tab) => (
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
    </div>
  );
}
