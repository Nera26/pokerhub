'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchNavItems,
  createNavItem,
  updateNavItem,
  deleteNavItem,
  type NavItem as UiNavItem,
} from '@/lib/api/nav';
import type { NavItemRequest } from '@shared/types';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';

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

export default function NavAdminPage() {
  useRequireAdmin();
  const [items, setItems] = useState<UiNavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingFlag, setEditingFlag] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const sortedItems = useCallback(
    (navItems: UiNavItem[]) => [...navItems].sort((a, b) => a.order - b.order),
    [],
  );

  const refreshItems = useCallback(async () => {
    try {
      const data = await fetchNavItems();
      setItems(sortedItems(data));
      setError(null);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to load navigation items: ${message}`);
      return false;
    }
  }, [sortedItems]);

  useEffect(() => {
    setLoading(true);
    refreshItems()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshItems]);

  const nextOrder = useMemo(() => {
    if (!items.length) return '1';
    return String(items[items.length - 1].order + 1);
  }, [items]);

  useEffect(() => {
    if (editingFlag) {
      const item = items.find((it) => it.flag === editingFlag);
      if (item) {
        setForm({
          flag: item.flag,
          href: item.href,
          label: item.label,
          icon: item.iconName ?? '',
          order: String(item.order),
        });
      }
    } else {
      setForm({ ...EMPTY_FORM, order: nextOrder });
    }
  }, [editingFlag, items, nextOrder]);

  const updateForm = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedFlag = form.flag.trim();
    const trimmedHref = form.href.trim();
    const trimmedLabel = form.label.trim();
    const trimmedIcon = form.icon.trim();
    const parsedOrder = Number(form.order);

    if (!Number.isInteger(parsedOrder)) {
      setError('Order must be an integer');
      return;
    }

    if (!trimmedFlag || !trimmedHref || !trimmedLabel) {
      setError('Flag, href, and label are required');
      return;
    }

    const payload: NavItemRequest = {
      flag: trimmedFlag,
      href: trimmedHref,
      label: trimmedLabel,
      order: parsedOrder,
      ...(trimmedIcon ? { icon: trimmedIcon } : {}),
    };

    setSubmitting(true);
    try {
      if (editingFlag) {
        await updateNavItem(editingFlag, payload);
      } else {
        await createNavItem(payload);
      }
      setEditingFlag(null);
      await refreshItems();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(
        `Failed to ${editingFlag ? 'update' : 'create'} nav item: ${message}`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (flag: string) => {
    setSubmitting(true);
    try {
      await deleteNavItem(flag);
      if (editingFlag === flag) {
        setEditingFlag(null);
      }
      await refreshItems();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to delete nav item: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const cancelEdit = () => {
    setEditingFlag(null);
  };

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
            onChange={(e) => updateForm('flag', e.target.value)}
            readOnly={!!editingFlag}
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
            onChange={(e) => updateForm('href', e.target.value)}
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
            onChange={(e) => updateForm('label', e.target.value)}
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
            onChange={(e) => updateForm('icon', e.target.value)}
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
            onChange={(e) => updateForm('order', e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {editingFlag ? 'Update item' : 'Create item'}
          </button>
          {editingFlag && (
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
                    onClick={() => setEditingFlag(item.flag)}
                    disabled={submitting}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-red-600 underline"
                    onClick={() => handleDelete(item.flag)}
                    disabled={submitting}
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
