'use client';

import { useEffect, useState } from 'react';
import {
  fetchAdminTabs,
  createAdminTab,
  updateAdminTab,
  deleteAdminTab,
} from '@/lib/api/admin';
import type { AdminTab } from '@shared/types';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';

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

  const [tabs, setTabs] = useState<AdminTab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminTab | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });

  useEffect(() => {
    let active = true;
    setLoading(true);

    fetchAdminTabs()
      .then((data) => {
        if (!active) return;
        setTabs(data.filter((tab) => tab.source !== 'config'));
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(`Failed to load admin tabs: ${normalizeError(err)}`);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const updateForm = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (formError) {
      setFormError(null);
    }
  };

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setEditing(null);
    setFormError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const trimmedId = form.id.trim();
    const trimmedTitle = form.title.trim();
    const trimmedComponent = form.component.trim();
    const trimmedIcon = form.icon.trim();

    if (!trimmedTitle || !trimmedComponent || (!editing && !trimmedId)) {
      setFormError('ID, title, component, and icon are required');
      return;
    }

    if (!trimmedIcon) {
      setFormError('Icon is required');
      return;
    }

    setSubmitting(true);

    try {
      if (editing) {
        const updated = await updateAdminTab(editing.id, {
          title: trimmedTitle,
          component: trimmedComponent,
          icon: trimmedIcon,
        });
        setTabs((prev) =>
          prev.map((tab) => (tab.id === editing.id ? updated : tab)),
        );
      } else {
        const created = await createAdminTab({
          id: trimmedId,
          title: trimmedTitle,
          component: trimmedComponent,
          icon: trimmedIcon,
        });
        setTabs((prev) => [...prev, created]);
      }

      resetForm();
    } catch (err) {
      setFormError(
        `Failed to ${editing ? 'update' : 'create'} admin tab: ${normalizeError(
          err,
        )}`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (tab: AdminTab) => {
    setEditing(tab);
    setForm({
      id: tab.id,
      title: tab.title ?? '',
      component: tab.component ?? '',
      icon: tab.icon ?? '',
    });
    setFormError(null);
  };

  const cancelEdit = () => {
    resetForm();
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setFormError(null);

    try {
      await deleteAdminTab(id);
      setTabs((prev) => prev.filter((tab) => tab.id !== id));
      if (editing?.id === id) {
        resetForm();
      }
    } catch (err) {
      setFormError(`Failed to delete admin tab: ${normalizeError(err)}`);
    } finally {
      setDeletingId(null);
    }
  };

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
              onChange={(event) => updateForm('id', event.target.value)}
              className="mt-1 rounded border border-gray-300 px-3 py-2"
              placeholder="analytics"
              readOnly={!!editing}
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
              onChange={(event) => updateForm('title', event.target.value)}
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
              onChange={(event) => updateForm('component', event.target.value)}
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
              onChange={(event) => updateForm('icon', event.target.value)}
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
            {editing ? 'Update tab' : 'Create tab'}
          </button>
          {editing && (
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
