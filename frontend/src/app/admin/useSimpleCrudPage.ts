'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';

type SubmitPreparation<CreatePayload, UpdatePayload, Item> =
  | { error: string }
  | { type: 'create'; payload: CreatePayload }
  | { type: 'update'; payload: UpdatePayload };

type UseSimpleCrudPageOptions<
  Item,
  FormState,
  CreatePayload,
  UpdatePayload = CreatePayload,
> = {
  emptyForm: FormState;
  fetchItems: () => Promise<Item[]>;
  createItem: (payload: CreatePayload) => Promise<unknown>;
  updateItem: (id: string, payload: UpdatePayload) => Promise<unknown>;
  deleteItem: (id: string) => Promise<void>;
  getItemId: (item: Item) => string;
  formFromItem: (item: Item) => FormState;
  prepareSubmit: (
    form: FormState,
    context: { editingItem: Item | null },
  ) => SubmitPreparation<CreatePayload, UpdatePayload, Item>;
  mapItems?: (items: Item[]) => Item[];
  computeInitialForm?: (items: Item[]) => Partial<FormState>;
  formatListError?: (error: unknown) => string;
  formatActionError?: (
    action: 'create' | 'update' | 'delete',
    error: unknown,
  ) => string;
};

type UseSimpleCrudPageReturn<Item, FormState> = {
  items: Item[];
  loading: boolean;
  listError: string | null;
  actionError: string | null;
  form: FormState;
  isEditing: boolean;
  submitting: boolean;
  deletingId: string | null;
  editingItem: Item | null;
  setFormValue: <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleDelete: (id: string) => Promise<void>;
  startEdit: (item: Item) => void;
  cancelEdit: () => void;
  refresh: () => Promise<void>;
};

function defaultListErrorFormatter(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

function defaultActionErrorFormatter(
  action: 'create' | 'update' | 'delete',
  error: unknown,
): string {
  const message =
    error instanceof Error ? error.message : 'Unknown error occurred';
  return `Failed to ${action} item: ${message}`;
}

export function useSimpleCrudPage<
  Item,
  FormState,
  CreatePayload,
  UpdatePayload = CreatePayload,
>(
  options: UseSimpleCrudPageOptions<
    Item,
    FormState,
    CreatePayload,
    UpdatePayload
  >,
): UseSimpleCrudPageReturn<Item, FormState> {
  const {
    emptyForm,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    getItemId,
    formFromItem,
    prepareSubmit,
    mapItems,
    computeInitialForm,
    formatListError = defaultListErrorFormatter,
    formatActionError = defaultActionErrorFormatter,
  } = options;

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    const data = await fetchItems();
    return mapItems ? mapItems(data) : data;
  }, [fetchItems, mapItems]);

  const refresh = useCallback(async () => {
    try {
      const nextItems = await loadItems();
      setItems(nextItems);
      setListError(null);
    } catch (err) {
      setListError(formatListError(err));
    }
  }, [loadItems, formatListError]);

  useEffect(() => {
    let active = true;
    setLoading(true);

    loadItems()
      .then((nextItems) => {
        if (!active) return;
        setItems(nextItems);
        setListError(null);
      })
      .catch((err) => {
        if (!active) return;
        setListError(formatListError(err));
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [loadItems, formatListError]);

  const editingItem = useMemo(() => {
    if (!editingId) {
      return null;
    }
    return items.find((item) => getItemId(item) === editingId) ?? null;
  }, [editingId, items, getItemId]);

  useEffect(() => {
    if (editingItem) {
      setForm(formFromItem(editingItem));
      return;
    }

    const defaults = computeInitialForm?.(items) ?? {};
    setForm({ ...emptyForm, ...defaults });
  }, [editingItem, items, formFromItem, computeInitialForm, emptyForm]);

  const setFormValue = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      if (actionError) {
        setActionError(null);
      }
    },
    [actionError],
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const preparation = prepareSubmit(form, { editingItem });
      if ('error' in preparation) {
        setActionError(preparation.error);
        return;
      }

      setActionError(null);
      setSubmitting(true);

      try {
        if (preparation.type === 'create') {
          await createItem(preparation.payload);
        } else {
          const item = editingItem;
          if (!item) {
            throw new Error('No item selected for update');
          }
          await updateItem(getItemId(item), preparation.payload);
        }
        setEditingId(null);
        await refresh();
      } catch (err) {
        setActionError(formatActionError(preparation.type, err));
      } finally {
        setSubmitting(false);
      }
    },
    [
      prepareSubmit,
      form,
      editingItem,
      createItem,
      updateItem,
      getItemId,
      refresh,
      formatActionError,
    ],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      setDeletingId(id);
      setActionError(null);
      try {
        await deleteItem(id);
        if (editingId === id) {
          setEditingId(null);
        }
        await refresh();
      } catch (err) {
        setActionError(formatActionError('delete', err));
      } finally {
        setDeletingId(null);
      }
    },
    [deleteItem, editingId, refresh, formatActionError],
  );

  const startEdit = useCallback(
    (item: Item) => {
      setEditingId(getItemId(item));
      setActionError(null);
    },
    [getItemId],
  );

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setActionError(null);
  }, []);

  const isEditing = !!editingItem;

  return {
    items,
    loading,
    listError,
    actionError,
    form,
    isEditing,
    submitting,
    deletingId,
    editingItem,
    setFormValue,
    handleSubmit,
    handleDelete,
    startEdit,
    cancelEdit,
    refresh,
  };
}
