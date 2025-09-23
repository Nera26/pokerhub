'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { type QueryKey, type UseMutationResult } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import { ZodError } from 'zod';
import { useTranslations } from '@/hooks/useTranslations';
import AdminTableManager, {
  type AdminTableManagerProps,
} from '@/app/components/dashboard/common/AdminTableManager';
import {
  useCrudState,
  type CrudMutationConfig,
  type CrudRemoveConfig,
  type CrudStateConfig,
} from './useCrudState';

export type CrudAction = 'create' | 'update' | 'delete';

export interface ActionErrorContext<TItem, TIdentifier> {
  item?: TItem | null;
  identifier?: TIdentifier;
}

export interface AdminCrudConfig<TItem, TCreate, TUpdate, TIdentifier>
  extends CrudStateConfig<TItem, TCreate, TUpdate, TIdentifier> {
  queryKey: QueryKey;
  formatListError?: (error: unknown) => string;
  formatActionError?: (
    action: CrudAction,
    error: unknown,
    context: ActionErrorContext<TItem, TIdentifier>,
  ) => string;
  getItemId?: (item: TItem) => TIdentifier;
}

export interface AdminCrudActionState<TInput> {
  execute: (input: TInput) => Promise<unknown>;
  mutation: UseMutationResult<unknown, unknown, TInput, unknown>;
  isEnabled: boolean;
}

export interface AdminCrudReturn<TItem, TCreate, TUpdate, TIdentifier> {
  items: TItem[];
  isLoading: boolean;
  error: unknown;
  listError: string | null;
  refetch: () => Promise<unknown>;
  mutations: {
    create: AdminCrudActionState<TCreate>;
    update: AdminCrudActionState<TUpdate>;
    delete: AdminCrudActionState<TIdentifier>;
  };
  formatActionError: (
    action: CrudAction,
    error: unknown,
    context: ActionErrorContext<TItem, TIdentifier>,
  ) => string;
  formatListError: (error: unknown) => string;
  getItemId?: (item: TItem) => TIdentifier;
}

function defaultListErrorFormatter(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error';
}

function defaultActionErrorFormatter(
  action: CrudAction,
  error: unknown,
): string {
  if (error instanceof ZodError) {
    return (
      error.errors[0]?.message ??
      `Failed to ${action} item due to invalid input.`
    );
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return `Failed to ${action} item.`;
}

export function useAdminCrud<TItem, TCreate, TUpdate, TIdentifier>(
  config: AdminCrudConfig<TItem, TCreate, TUpdate, TIdentifier>,
): AdminCrudReturn<TItem, TCreate, TUpdate, TIdentifier> {
  const {
    queryKey,
    fetchItems,
    transformItems,
    create,
    update,
    remove,
    onSuccess,
    onError,
    formatListError: formatListErrorProp,
    formatActionError: formatActionErrorProp,
    getItemId,
  } = config;

  const {
    items,
    isLoading,
    error,
    refetch,
    createMutation,
    updateMutation,
    deleteMutation,
    executeCreate,
    executeUpdate,
    executeDelete,
  } = useCrudState<TItem, TCreate, TUpdate, TIdentifier>({
    queryKey,
    fetchItems,
    transformItems,
    create,
    update,
    remove,
    onSuccess,
    onError,
  });

  const formatListError = useCallback(
    (listError: unknown) =>
      formatListErrorProp?.(listError) ?? defaultListErrorFormatter(listError),
    [formatListErrorProp],
  );

  const formatActionError = useCallback(
    (
      action: CrudAction,
      actionError: unknown,
      context: ActionErrorContext<TItem, TIdentifier>,
    ) =>
      formatActionErrorProp?.(action, actionError, context) ??
      defaultActionErrorFormatter(action, actionError),
    [formatActionErrorProp],
  );

  const listError = error ? formatListError(error) : null;

  const mutations = useMemo(
    () => ({
      create: {
        execute: executeCreate,
        mutation: createMutation,
        isEnabled: !!create,
      },
      update: {
        execute: executeUpdate,
        mutation: updateMutation,
        isEnabled: !!update,
      },
      delete: {
        execute: executeDelete,
        mutation: deleteMutation,
        isEnabled: !!remove,
      },
    }),
    [
      create,
      createMutation,
      executeCreate,
      executeDelete,
      executeUpdate,
      remove,
      deleteMutation,
      update,
      updateMutation,
    ],
  );

  return {
    items,
    isLoading,
    error,
    listError,
    refetch,
    mutations,
    formatActionError,
    formatListError,
    getItemId,
  };
}

export type SubmitPreparation<CreatePayload, UpdatePayload, Item> =
  | { error: string }
  | { type: 'create'; payload: CreatePayload }
  | { type: 'update'; payload: UpdatePayload };

export interface AdminCrudFormOptions<
  Item,
  FormState,
  CreateInput,
  UpdateInput,
  TIdentifier,
> {
  emptyForm: FormState;
  formFromItem: (item: Item) => FormState;
  prepareSubmit: (
    form: FormState,
    context: { editingItem: Item | null },
  ) => SubmitPreparation<CreateInput, UpdateInput, Item>;
  getItemId: (item: Item) => TIdentifier;
  computeInitialForm?: (items: Item[]) => Partial<FormState>;
  formatActionError?: (
    action: CrudAction,
    error: unknown,
    context: ActionErrorContext<Item, TIdentifier>,
  ) => string;
  mapDeleteIdentifier?: (
    identifier: TIdentifier,
    context: { item: Item | null },
  ) => TIdentifier;
}

export interface AdminCrudFormReturn<Item, FormState, TIdentifier> {
  items: Item[];
  loading: boolean;
  listError: string | null;
  actionError: string | null;
  form: FormState;
  isEditing: boolean;
  submitting: boolean;
  deletingId: TIdentifier | null;
  editingItem: Item | null;
  setFormValue: <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleDelete: (identifier: TIdentifier) => Promise<void>;
  startEdit: (item: Item) => void;
  cancelEdit: () => void;
  refresh: () => Promise<void>;
}

export function useAdminCrudForm<
  Item,
  FormState,
  CreateInput,
  UpdateInput,
  TIdentifier,
>(
  crud: AdminCrudReturn<Item, CreateInput, UpdateInput, TIdentifier>,
  options: AdminCrudFormOptions<
    Item,
    FormState,
    CreateInput,
    UpdateInput,
    TIdentifier
  >,
): AdminCrudFormReturn<Item, FormState, TIdentifier> {
  const {
    emptyForm,
    formFromItem,
    prepareSubmit,
    getItemId,
    computeInitialForm,
    formatActionError: formatActionErrorOverride,
    mapDeleteIdentifier,
  } = options;

  const [form, setForm] = useState<FormState>(emptyForm);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<TIdentifier | null>(null);
  const [deletingId, setDeletingId] = useState<TIdentifier | null>(null);

  const formatActionError = useCallback(
    (
      action: CrudAction,
      error: unknown,
      context: ActionErrorContext<Item, TIdentifier>,
    ) =>
      formatActionErrorOverride?.(action, error, context) ??
      crud.formatActionError(action, error, context),
    [crud, formatActionErrorOverride],
  );

  const items = crud.items;
  const editingItem = useMemo(() => {
    if (editingId == null) {
      return null;
    }
    return (
      items.find((candidate) => getItemId(candidate) === editingId) ?? null
    );
  }, [editingId, getItemId, items]);

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

      if (preparation.type === 'create') {
        try {
          await crud.mutations.create.execute(preparation.payload);
          setActionError(null);
          return;
        } catch (mutationError) {
          setActionError(
            formatActionError('create', mutationError, {
              item: editingItem ?? null,
            }),
          );
          return;
        }
      }

      if (!editingItem) {
        setActionError(
          formatActionError(
            'update',
            new Error('No item selected for update'),
            { item: null },
          ),
        );
        return;
      }

      try {
        await crud.mutations.update.execute(preparation.payload);
        setEditingId(null);
        setActionError(null);
      } catch (mutationError) {
        setActionError(
          formatActionError('update', mutationError, {
            item: editingItem,
          }),
        );
      }
    },
    [
      crud.mutations.create,
      crud.mutations.update,
      editingItem,
      formatActionError,
      form,
      prepareSubmit,
    ],
  );

  const handleDelete = useCallback(
    async (identifier: TIdentifier) => {
      if (!crud.mutations.delete.isEnabled) {
        return;
      }
      const item =
        items.find((candidate) => getItemId(candidate) === identifier) ?? null;
      const payload = mapDeleteIdentifier
        ? mapDeleteIdentifier(identifier, { item })
        : identifier;

      setDeletingId(identifier);
      setActionError(null);
      try {
        await crud.mutations.delete.execute(payload);
        if (editingId !== null && editingId === identifier) {
          setEditingId(null);
        }
      } catch (mutationError) {
        setActionError(
          formatActionError('delete', mutationError, {
            item,
            identifier,
          }),
        );
      } finally {
        setDeletingId(null);
      }
    },
    [
      crud.mutations.delete,
      editingId,
      formatActionError,
      getItemId,
      items,
      mapDeleteIdentifier,
    ],
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

  const refresh = crud.refetch;

  const submitting =
    crud.mutations.create.mutation.isPending ||
    crud.mutations.update.mutation.isPending;

  return {
    items,
    loading: crud.isLoading,
    listError: crud.listError,
    actionError,
    form,
    isEditing: editingItem != null,
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

export type CrudModalMode = 'create' | 'edit' | 'delete';

interface CrudManagerTableConfig<TItem> {
  header: React.ReactNode;
  renderRow: (
    item: TItem,
    helpers: {
      openEdit: (item: TItem) => void;
      openDelete: (item: TItem) => void;
      deleteItem: (item: TItem) => void;
    },
  ) => React.ReactNode;
  searchFilter: (item: TItem, query: string) => boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  caption?: string;
  pageSize?: number;
}

interface CrudManagerTranslationKeys {
  searchPlaceholder?: string;
  emptyMessage?: string;
  caption?: string;
}

interface CrudManagerErrors {
  create?: string;
  update?: string;
  delete?: string;
}

export interface AdminCrudTableConfig<TItem, TCreate, TUpdate, TIdentifier> {
  table: CrudManagerTableConfig<TItem>;
  getItemId: (item: TItem) => TIdentifier;
  translationKeys?: CrudManagerTranslationKeys;
  errorMessages?: CrudManagerErrors;
}

interface CrudManagerModalState<TItem> {
  mode: CrudModalMode;
  item: TItem | null;
}

export interface AdminCrudTableReturn<TItem, TCreate, TUpdate, TIdentifier> {
  modals: {
    mode: CrudModalMode | null;
    selected: TItem | null;
    isCreateOpen: boolean;
    isEditOpen: boolean;
    isDeleteOpen: boolean;
    openCreate: () => void;
    openEdit: (item: TItem) => void;
    openDelete: (item: TItem) => void;
    close: () => void;
  };
  actions: {
    submitCreate: (values: TCreate) => void;
    submitUpdate: (values: TUpdate) => void;
    submitDelete: (identifier?: TIdentifier) => void;
    createMutation: UseMutationResult<unknown, unknown, TCreate, unknown>;
    updateMutation: UseMutationResult<unknown, unknown, TUpdate, unknown>;
    deleteMutation: UseMutationResult<unknown, unknown, TIdentifier, unknown>;
  };
  formError: string | null;
  setFormError: (value: string | null) => void;
  table: {
    props: AdminTableManagerProps<TItem>;
    key: number;
    View: () => JSX.Element;
  };
  resetTableState: () => void;
}

function resolveMessage(
  translations: Record<string, string> | undefined,
  key: string | undefined,
  fallback: string | undefined,
) {
  if (!key) {
    return fallback;
  }
  return translations?.[key] ?? fallback;
}

export function useAdminCrudTable<TItem, TCreate, TUpdate, TIdentifier>(
  crud: AdminCrudReturn<TItem, TCreate, TUpdate, TIdentifier>,
  config: AdminCrudTableConfig<TItem, TCreate, TUpdate, TIdentifier>,
): AdminCrudTableReturn<TItem, TCreate, TUpdate, TIdentifier> {
  const { table, getItemId, translationKeys, errorMessages } = config;

  const [tableInstance, setTableInstance] = useState(0);
  const resetTableState = useCallback(() => {
    setTableInstance((value) => value + 1);
  }, []);

  const [modalState, setModalState] =
    useState<CrudManagerModalState<TItem> | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const lastSelectedRef = useRef<TItem | null>(null);

  const close = useCallback(() => {
    setModalState(null);
    setFormError(null);
    lastSelectedRef.current = null;
  }, []);

  const openCreate = useCallback(() => {
    lastSelectedRef.current = null;
    setModalState({ mode: 'create', item: null });
    setFormError(null);
  }, []);

  const openEdit = useCallback((item: TItem) => {
    lastSelectedRef.current = item;
    setModalState({ mode: 'edit', item });
    setFormError(null);
  }, []);

  const openDelete = useCallback((item: TItem) => {
    lastSelectedRef.current = item;
    setModalState({ mode: 'delete', item });
  }, []);

  const locale = useLocale();
  const { data: translations } = useTranslations(locale);

  const deriveActionMessage = useCallback(
    (
      action: CrudAction,
      error: unknown,
      context: ActionErrorContext<TItem, TIdentifier>,
    ) => {
      if (error instanceof ZodError) {
        return (
          error.errors[0]?.message ??
          errorMessages?.[action] ??
          crud.formatActionError(action, error, context)
        );
      }
      if (errorMessages?.[action]) {
        return errorMessages[action]!;
      }
      return crud.formatActionError(action, error, context);
    },
    [crud, errorMessages],
  );

  const handleDeleteFromRow = useCallback(
    (item: TItem) => {
      if (!crud.mutations.delete.isEnabled) return;
      lastSelectedRef.current = item;
      const identifier = getItemId(item);
      void crud.mutations.delete.execute(identifier).catch((error: unknown) => {
        setFormError(
          deriveActionMessage('delete', error, {
            item,
            identifier,
          }),
        );
      });
    },
    [crud.mutations.delete, deriveActionMessage, getItemId],
  );

  const submitCreate = useCallback(
    (values: TCreate) => {
      if (!crud.mutations.create.isEnabled) return;
      setFormError(null);
      void crud.mutations.create
        .execute(values)
        .then(() => {
          resetTableState();
          close();
        })
        .catch((error: unknown) => {
          setFormError(deriveActionMessage('create', error, { item: null }));
        });
    },
    [close, crud.mutations.create, deriveActionMessage, resetTableState],
  );

  const submitUpdate = useCallback(
    (values: TUpdate) => {
      if (!crud.mutations.update.isEnabled) return;
      const item = lastSelectedRef.current;
      setFormError(null);
      void crud.mutations.update
        .execute(values)
        .then(() => {
          resetTableState();
          close();
        })
        .catch((error: unknown) => {
          setFormError(
            deriveActionMessage('update', error, {
              item: item ?? null,
            }),
          );
        });
    },
    [close, crud.mutations.update, deriveActionMessage, resetTableState],
  );

  const submitDelete = useCallback(
    (identifier?: TIdentifier) => {
      if (!crud.mutations.delete.isEnabled) return;
      const fromState = modalState?.item
        ? getItemId(modalState.item)
        : undefined;
      const target = identifier ?? fromState;
      if (target === undefined) return;
      const contextItem = identifier
        ? (crud.items.find((item) => getItemId(item) === identifier) ?? null)
        : (modalState?.item ?? null);

      void crud.mutations.delete
        .execute(target)
        .then(() => {
          resetTableState();
          close();
        })
        .catch((error: unknown) => {
          setFormError(
            deriveActionMessage('delete', error, {
              item: contextItem,
              identifier: target,
            }),
          );
        });
    },
    [
      close,
      crud.items,
      crud.mutations.delete,
      deriveActionMessage,
      getItemId,
      modalState,
      resetTableState,
    ],
  );

  const header = table.header;
  const renderRowConfig = table.renderRow;
  const searchFilter = table.searchFilter;
  const tableSearchPlaceholder = table.searchPlaceholder;
  const tableEmptyMessage = table.emptyMessage;
  const tableCaption = table.caption;
  const pageSize = table.pageSize;

  const searchPlaceholder =
    resolveMessage(
      translations,
      translationKeys?.searchPlaceholder,
      tableSearchPlaceholder,
    ) ??
    translations?.searchPlaceholder ??
    tableSearchPlaceholder ??
    'Search...';

  const emptyMessage =
    resolveMessage(
      translations,
      translationKeys?.emptyMessage,
      tableEmptyMessage,
    ) ??
    translations?.noResultsFound ??
    tableEmptyMessage ??
    'No results found.';

  const caption =
    resolveMessage(translations, translationKeys?.caption, tableCaption) ??
    tableCaption;

  const renderRow = useCallback(
    (item: TItem) =>
      renderRowConfig(item, {
        openEdit,
        openDelete,
        deleteItem: handleDeleteFromRow,
      }),
    [handleDeleteFromRow, openDelete, openEdit, renderRowConfig],
  );

  const tableProps = useMemo<AdminTableManagerProps<TItem>>(
    () => ({
      items: crud.items,
      header,
      renderRow,
      searchFilter,
      searchPlaceholder,
      emptyMessage,
      caption,
      pageSize,
    }),
    [
      crud.items,
      header,
      renderRow,
      searchFilter,
      searchPlaceholder,
      emptyMessage,
      caption,
      pageSize,
    ],
  );

  const TableView = useCallback(
    () => <AdminTableManager key={tableInstance} {...tableProps} />,
    [tableInstance, tableProps],
  );

  return {
    modals: {
      mode: modalState?.mode ?? null,
      selected: modalState?.item ?? null,
      isCreateOpen: modalState?.mode === 'create',
      isEditOpen: modalState?.mode === 'edit',
      isDeleteOpen: modalState?.mode === 'delete',
      openCreate,
      openEdit,
      openDelete,
      close,
    },
    actions: {
      submitCreate,
      submitUpdate,
      submitDelete,
      createMutation: crud.mutations.create.mutation,
      updateMutation: crud.mutations.update.mutation,
      deleteMutation: crud.mutations.delete.mutation,
    },
    formError,
    setFormError,
    table: {
      props: tableProps,
      key: tableInstance,
      View: TableView,
    },
    resetTableState,
  };
}

export type AdminCrudMutationConfig<TInput> = CrudMutationConfig<TInput>;
export type AdminCrudRemoveConfig<TIdentifier> = CrudRemoveConfig<TIdentifier>;
