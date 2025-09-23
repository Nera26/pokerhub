'use client';

import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { type QueryKey, type UseMutationResult } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import { useTranslations } from '@/hooks/useTranslations';
import AdminTableManager, {
  type AdminTableManagerProps,
} from '@/app/components/dashboard/common/AdminTableManager';
import { ZodError } from 'zod';
import {
  useCrudState,
  type CrudMutationConfig,
  type CrudRemoveConfig,
} from './useCrudState';

export type CrudModalMode = 'create' | 'edit' | 'delete';

interface CrudManagerTableConfig<TItem> {
  header: ReactNode;
  renderRow: (
    item: TItem,
    helpers: {
      openEdit: (item: TItem) => void;
      openDelete: (item: TItem) => void;
      deleteItem: (item: TItem) => void;
    },
  ) => ReactNode;
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

interface CrudManagerCallbacks<TItem, TCreate, TUpdate, TIdentifier> {
  onSuccess?: {
    create?: (variables: TCreate) => void;
    update?: (variables: TUpdate, item: TItem | null) => void;
    delete?: (identifier: TIdentifier, item: TItem | null) => void;
  };
  onError?: {
    create?: (error: unknown) => void;
    update?: (error: unknown) => void;
    delete?: (error: unknown) => void;
  };
}

interface CrudManagerErrors {
  create?: string;
  update?: string;
  delete?: string;
}

export interface CrudManagerConfig<TItem, TCreate, TUpdate, TIdentifier>
  extends CrudManagerCallbacks<TItem, TCreate, TUpdate, TIdentifier> {
  queryKey: QueryKey;
  fetchItems: () => Promise<TItem[]>;
  getItemId: (item: TItem) => TIdentifier;
  table: CrudManagerTableConfig<TItem>;
  create?: CrudMutationConfig<TCreate>;
  update?: CrudMutationConfig<TUpdate>;
  remove?: CrudRemoveConfig<TIdentifier>;
  transformItems?: (items: TItem[]) => TItem[];
  translationKeys?: CrudManagerTranslationKeys;
  errorMessages?: CrudManagerErrors;
}

interface CrudManagerModalState<TItem> {
  mode: CrudModalMode;
  item: TItem | null;
}

interface CrudManagerModals<TItem> {
  mode: CrudModalMode | null;
  selected: TItem | null;
  isCreateOpen: boolean;
  isEditOpen: boolean;
  isDeleteOpen: boolean;
  openCreate: () => void;
  openEdit: (item: TItem) => void;
  openDelete: (item: TItem) => void;
  close: () => void;
}

interface CrudManagerActions<TCreate, TUpdate, TIdentifier> {
  submitCreate: (values: TCreate) => void;
  submitUpdate: (values: TUpdate) => void;
  submitDelete: (id?: TIdentifier) => void;
  createMutation: UseMutationResult<unknown, unknown, TCreate, unknown>;
  updateMutation: UseMutationResult<unknown, unknown, TUpdate, unknown>;
  deleteMutation: UseMutationResult<unknown, unknown, TIdentifier, unknown>;
}

interface CrudManagerTable<TItem> {
  props: AdminTableManagerProps<TItem>;
  key: number;
  View: () => JSX.Element;
}

export interface CrudManagerReturn<TItem, TCreate, TUpdate, TIdentifier> {
  isLoading: boolean;
  error: unknown;
  items: TItem[];
  modals: CrudManagerModals<TItem>;
  actions: CrudManagerActions<TCreate, TUpdate, TIdentifier>;
  formError: string | null;
  setFormError: (value: string | null) => void;
  table: CrudManagerTable<TItem>;
  resetTableState: () => void;
  refetch: () => Promise<unknown>;
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

export function useCrudManager<TItem, TCreate, TUpdate, TIdentifier>(
  config: CrudManagerConfig<TItem, TCreate, TUpdate, TIdentifier>,
): CrudManagerReturn<TItem, TCreate, TUpdate, TIdentifier> {
  const {
    queryKey,
    fetchItems,
    getItemId,
    table,
    create,
    update,
    remove,
    transformItems,
    translationKeys,
    errorMessages,
    onSuccess,
    onError,
  } = config;

  const locale = useLocale();
  const { data: translations } = useTranslations(locale);

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

  const handleCreateSuccess = useCallback(
    (variables: TCreate) => {
      onSuccess?.create?.(variables);
      resetTableState();
      close();
    },
    [close, onSuccess, resetTableState],
  );

  const handleUpdateSuccess = useCallback(
    (variables: TUpdate) => {
      const selected = lastSelectedRef.current;
      onSuccess?.update?.(variables, selected);
      resetTableState();
      close();
    },
    [close, onSuccess, resetTableState],
  );

  const handleDeleteSuccess = useCallback(
    (identifier: TIdentifier) => {
      const selected = lastSelectedRef.current;
      onSuccess?.delete?.(identifier, selected);
      resetTableState();
      close();
    },
    [close, onSuccess, resetTableState],
  );

  const handleCreateError = useCallback(
    (mutationError: unknown) => {
      let message: string;
      if (mutationError instanceof ZodError) {
        message =
          mutationError.errors[0]?.message ??
          errorMessages?.create ??
          'Invalid input provided';
      } else if (mutationError instanceof Error) {
        message = errorMessages?.create ?? mutationError.message;
      } else {
        message = errorMessages?.create ?? 'Failed to create item';
      }
      setFormError(message);
      onError?.create?.(mutationError);
    },
    [errorMessages?.create, onError],
  );

  const handleUpdateError = useCallback(
    (mutationError: unknown) => {
      let message: string;
      if (mutationError instanceof ZodError) {
        message =
          mutationError.errors[0]?.message ??
          errorMessages?.update ??
          'Invalid input provided';
      } else if (mutationError instanceof Error) {
        message = errorMessages?.update ?? mutationError.message;
      } else {
        message = errorMessages?.update ?? 'Failed to update item';
      }
      setFormError(message);
      onError?.update?.(mutationError);
    },
    [errorMessages?.update, onError],
  );

  const handleDeleteError = useCallback(
    (mutationError: unknown) => {
      onError?.delete?.(mutationError);
    },
    [onError],
  );

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
    onSuccess: {
      create: handleCreateSuccess,
      update: handleUpdateSuccess,
      delete: handleDeleteSuccess,
    },
    onError: {
      create: handleCreateError,
      update: handleUpdateError,
      delete: handleDeleteError,
    },
  });

  const handleDeleteFromRow = useCallback(
    (item: TItem) => {
      if (!remove) return;
      lastSelectedRef.current = item;
      void executeDelete(getItemId(item)).catch(() => undefined);
    },
    [executeDelete, getItemId, remove],
  );

  const submitCreate = useCallback(
    (values: TCreate) => {
      if (!create) return;
      setFormError(null);
      void executeCreate(values).catch(() => undefined);
    },
    [create, executeCreate],
  );

  const submitUpdate = useCallback(
    (values: TUpdate) => {
      if (!update) return;
      setFormError(null);
      void executeUpdate(values).catch(() => undefined);
    },
    [executeUpdate, update],
  );

  const submitDelete = useCallback(
    (id?: TIdentifier) => {
      if (!remove) return;
      const targetId =
        id ?? (modalState?.item ? getItemId(modalState.item) : undefined);
      if (targetId === undefined) return;
      void executeDelete(targetId).catch(() => undefined);
    },
    [executeDelete, getItemId, modalState, remove],
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
      items,
      header,
      renderRow,
      searchFilter,
      searchPlaceholder,
      emptyMessage,
      caption,
      pageSize,
    }),
    [
      items,
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

  const modals: CrudManagerModals<TItem> = {
    mode: modalState?.mode ?? null,
    selected: modalState?.item ?? null,
    isCreateOpen: modalState?.mode === 'create',
    isEditOpen: modalState?.mode === 'edit',
    isDeleteOpen: modalState?.mode === 'delete',
    openCreate,
    openEdit,
    openDelete,
    close,
  };

  const actions: CrudManagerActions<TCreate, TUpdate, TIdentifier> = {
    submitCreate,
    submitUpdate,
    submitDelete,
    createMutation,
    updateMutation,
    deleteMutation,
  };

  return {
    isLoading,
    error,
    items,
    modals,
    actions,
    formError,
    setFormError,
    table: {
      props: tableProps,
      key: tableInstance,
      View: TableView,
    },
    resetTableState,
    refetch,
  };
}
