'use client';

import { useEffect, useState } from 'react';
import {
  fetchNavItems,
  createNavItem,
  updateNavItem,
  deleteNavItem,
  type NavItemRequest,
} from '@/lib/api/nav';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';

export default function NavAdminPage() {
  useRequireAdmin();
  const [items, setItems] = useState<NavItemRequest[]>([]);
  const [editing, setEditing] = useState<NavItemRequest | null>(null);

  useEffect(() => {
    fetchNavItems().then((data) =>
      setItems(data.map((i, idx) => ({ ...i, order: idx + 1 }))),
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const body: NavItemRequest = {
      flag: formData.get('flag') as string,
      href: formData.get('href') as string,
      label: formData.get('label') as string,
      icon: (formData.get('icon') as string) || undefined,
      order: Number(formData.get('order') as string),
    };
    if (editing) {
      await updateNavItem(editing.flag, body);
      setItems((prev) => prev.map((i) => (i.flag === editing.flag ? body : i)));
      setEditing(null);
    } else {
      await createNavItem(body);
      setItems((prev) => [...prev, body]);
    }
    e.currentTarget.reset();
  };

  const handleDelete = async (flag: string) => {
    await deleteNavItem(flag);
    setItems((prev) => prev.filter((i) => i.flag !== flag));
  };

  const startEdit = (item: NavItemRequest) => {
    setEditing(item);
  };

  return (
    <div className="p-4">
      <h1 className="mb-4 text-xl font-bold">Nav Items</h1>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input name="flag" placeholder="flag" defaultValue={editing?.flag} />
        <input name="href" placeholder="href" defaultValue={editing?.href} />
        <input name="label" placeholder="label" defaultValue={editing?.label} />
        <input name="icon" placeholder="icon" defaultValue={editing?.icon} />
        <input
          name="order"
          type="number"
          placeholder="order"
          defaultValue={editing?.order ?? items.length + 1}
        />
        <button type="submit" className="btn btn-primary">
          {editing ? 'Update' : 'Create'}
        </button>
      </form>
      <ul className="mt-4 space-y-1">
        {items.map((item) => (
          <li key={item.flag} className="flex items-center gap-2">
            <span>{item.label}</span>
            <button
              className="text-blue-600 underline"
              onClick={() => startEdit(item)}
            >
              Edit
            </button>
            <button
              className="text-red-600 underline"
              onClick={() => handleDelete(item.flag)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
