'use client';

import { useCallback, useMemo } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
  type UseMutationResult,
} from '@tanstack/react-query';

export interface CrudMutationConfig<TInput> {
  mutationFn: (input: TInput) => Promise<unknown>;
  parse?: (input: TInput) => TInput;
}

export interface CrudRemoveConfig<TIdentifier> {
  mutationFn: (id: TIdentifier) => Promise<unknown>;
}

export interface CrudCallbacks<TCreate, TUpdate, TIdentifier> {
  onSuccess?: {
    create?: (variables: TCreate) => void;
    update?: (variables: TUpdate) => void;
    delete?: (identifier: TIdentifier) => void;
  };
  onError?: {
    create?: (error: unknown) => void;
    update?: (error: unknown) => void;
    delete?: (error: unknown) => void;
  };
}

export interface CrudStateConfig<TItem, TCreate, TUpdate, TIdentifier>
  extends CrudCallbacks<TCreate, TUpdate, TIdentifier> {
  queryKey: QueryKey;
  fetchItems: () => Promise<TItem[]>;
  transformItems?: (items: TItem[]) => TItem[];
  create?: CrudMutationConfig<TCreate>;
  update?: CrudMutationConfig<TUpdate>;
  remove?: CrudRemoveConfig<TIdentifier>;
}

export interface CrudStateReturn<TItem, TCreate, TUpdate, TIdentifier> {
  items: TItem[];
  isLoading: boolean;
  error: unknown;
  refetch: () => Promise<unknown>;
  createMutation: UseMutationResult<unknown, unknown, TCreate, unknown>;
  updateMutation: UseMutationResult<unknown, unknown, TUpdate, unknown>;
  deleteMutation: UseMutationResult<unknown, unknown, TIdentifier, unknown>;
  executeCreate: (values: TCreate) => Promise<unknown>;
  executeUpdate: (values: TUpdate) => Promise<unknown>;
  executeDelete: (identifier: TIdentifier) => Promise<unknown>;
}

export function useCrudState<TItem, TCreate, TUpdate, TIdentifier>(
  config: CrudStateConfig<TItem, TCreate, TUpdate, TIdentifier>,
): CrudStateReturn<TItem, TCreate, TUpdate, TIdentifier> {
  const {
    queryKey,
    fetchItems,
    transformItems,
    create,
    update,
    remove,
    onSuccess,
    onError,
  } = config;

  const queryClient = useQueryClient();

  const {
    data: fetchedItems = [],
    isLoading,
    error,
    refetch,
  } = useQuery<TItem[]>({
    queryKey,
    queryFn: fetchItems,
  });

  const items = useMemo(() => {
    return transformItems ? transformItems(fetchedItems) : fetchedItems;
  }, [fetchedItems, transformItems]);

  const createMutation = useMutation<unknown, unknown, TCreate>({
    mutationFn: async (values: TCreate) => {
      if (!create) {
        throw new Error('Create mutation not configured');
      }
      return create.mutationFn(values);
    },
    onSuccess: (_data, variables) => {
      onSuccess?.create?.(variables);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (mutationError) => {
      onError?.create?.(mutationError);
    },
  });

  const updateMutation = useMutation<unknown, unknown, TUpdate>({
    mutationFn: async (values: TUpdate) => {
      if (!update) {
        throw new Error('Update mutation not configured');
      }
      return update.mutationFn(values);
    },
    onSuccess: (_data, variables) => {
      onSuccess?.update?.(variables);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (mutationError) => {
      onError?.update?.(mutationError);
    },
  });

  const deleteMutation = useMutation<unknown, unknown, TIdentifier>({
    mutationFn: async (id: TIdentifier) => {
      if (!remove) {
        throw new Error('Delete mutation not configured');
      }
      return remove.mutationFn(id);
    },
    onSuccess: (_data, variables) => {
      onSuccess?.delete?.(variables);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (mutationError) => {
      onError?.delete?.(mutationError);
    },
  });

  const executeCreate = useCallback(
    async (values: TCreate) => {
      if (!create) {
        const error = new Error('Create mutation not configured');
        onError?.create?.(error);
        throw error;
      }

      let parsed: TCreate;
      try {
        parsed = create.parse ? create.parse(values) : values;
      } catch (parseError) {
        onError?.create?.(parseError);
        throw parseError;
      }

      return createMutation.mutateAsync(parsed);
    },
    [create, createMutation, onError],
  );

  const executeUpdate = useCallback(
    async (values: TUpdate) => {
      if (!update) {
        const error = new Error('Update mutation not configured');
        onError?.update?.(error);
        throw error;
      }

      let parsed: TUpdate;
      try {
        parsed = update.parse ? update.parse(values) : values;
      } catch (parseError) {
        onError?.update?.(parseError);
        throw parseError;
      }

      return updateMutation.mutateAsync(parsed);
    },
    [update, updateMutation, onError],
  );

  const executeDelete = useCallback(
    async (identifier: TIdentifier) => {
      if (!remove) {
        const error = new Error('Delete mutation not configured');
        onError?.delete?.(error);
        throw error;
      }

      return deleteMutation.mutateAsync(identifier);
    },
    [deleteMutation, onError, remove],
  );

  return {
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
  };
}
