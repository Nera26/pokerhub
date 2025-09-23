'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';
import { type QueryKey } from '@tanstack/react-query';
import { useCrudState } from '@/hooks/admin/useCrudState';

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
  queryKey?: QueryKey;
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
    queryKey,
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

  const [form, setForm] = useState<FormState>(emptyForm);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreateError = useCallback(
    (error: unknown) => {
      setActionError(formatActionError('create', error));
    },
    [formatActionError],
  );

  const handleUpdateError = useCallback(
    (error: unknown) => {
      setActionError(formatActionError('update', error));
    },
    [formatActionError],
  );

  const handleDeleteError = useCallback(
    (error: unknown) => {
      setActionError(formatActionError('delete', error));
    },
    [formatActionError],
  );

  const handleActionSuccess = useCallback(() => {
    setActionError(null);
  }, []);

  const {
    items: fetchedItems,
    isLoading: loading,
    error: listErrorRaw,
    refetch,
    createMutation,
    updateMutation,
    executeCreate,
    executeUpdate,
    executeDelete,
  } = useCrudState<
    Item,
    CreatePayload,
    { id: string; payload: UpdatePayload },
    string
  >({
    queryKey: queryKey ?? [
      'admin',
      'simple-crud',
      fetchItems.name || 'resource',
    ],
    fetchItems,
    transformItems: mapItems,
    create: { mutationFn: createItem },
    update: {
      mutationFn: ({ id, payload }) => updateItem(id, payload),
    },
    remove: { mutationFn: deleteItem },
    onSuccess: {
      create: handleActionSuccess,
      update: handleActionSuccess,
      delete: handleActionSuccess,
    },
    onError: {
      create: handleCreateError,
      update: handleUpdateError,
      delete: handleDeleteError,
    },
  });

  const items = fetchedItems;
  const listError = listErrorRaw ? formatListError(listErrorRaw) : null;

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

      try {
        if (preparation.type === 'create') {
          await executeCreate(preparation.payload);
        } else {
          const item = editingItem;
          if (!item) {
            setActionError(
              formatActionError(
                'update',
                new Error('No item selected for update'),
              ),
            );
            return;
          }
          await executeUpdate({
            id: getItemId(item),
            payload: preparation.payload,
          });
          setEditingId(null);
        }
      } catch {
        // Errors are surfaced via the shared onError handlers
      }
    },
    [
      executeCreate,
      executeUpdate,
      form,
      editingItem,
      prepareSubmit,
      getItemId,
      formatActionError,
    ],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      setDeletingId(id);
      setActionError(null);
      try {
        await executeDelete(id);
        if (editingId === id) {
          setEditingId(null);
        }
      } catch {
        // Error handling managed in handleDeleteError
      } finally {
        setDeletingId(null);
      }
    },
    [editingId, executeDelete],
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
  const submitting = createMutation.isPending || updateMutation.isPending;

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

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
