'use client';

import { useEffect, useState } from 'react';
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

export default function NavAdminPage() {
  useRequireAdmin();
  const [items, setItems] = useState<AdminTab[]>([]);
  const [editing, setEditing] = useState<AdminTab | null>(null);

  useEffect(() => {
    fetchAdminTabs().then((data) =>
      setItems(data.filter((tab) => tab.source !== 'config')),
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      title: formData.get('title') as string,
      icon: (formData.get('icon') as string) ?? '',
      component: formData.get('component') as string,
    } satisfies UpdateAdminTabRequest;
    if (editing) {
      const updated = await updateAdminTab(editing.id, payload);
      setItems((prev) =>
        prev.map((item) => (item.id === editing.id ? updated : item)),
      );
      setEditing(null);
    } else {
      const id = formData.get('id') as string;
      const created = await createAdminTab({
        id,
        ...payload,
      } satisfies CreateAdminTabRequest);
      setItems((prev) => [...prev, created]);
    }
    e.currentTarget.reset();
  };

  const handleDelete = async (id: string) => {
    await deleteAdminTab(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const startEdit = (item: AdminTab) => {
    setEditing(item);
  };

  return (
    <div className="p-4">
      <h1 className="mb-4 text-xl font-bold">Admin Tabs</h1>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          name="id"
          placeholder="id"
          defaultValue={editing?.id}
          readOnly={!!editing}
        />
        <input name="title" placeholder="title" defaultValue={editing?.title} />
        <input
          name="component"
          placeholder="component"
          defaultValue={editing?.component}
        />
        <input name="icon" placeholder="icon" defaultValue={editing?.icon} />
        <button type="submit" className="btn btn-primary">
          {editing ? 'Update' : 'Create'}
        </button>
      </form>
      <ul className="mt-4 space-y-1">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2">
            <span>{item.title}</span>
            <button
              className="text-blue-600 underline"
              onClick={() => startEdit(item)}
            >
              Edit
            </button>
            <button
              className="text-red-600 underline"
              onClick={() => handleDelete(item.id)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
