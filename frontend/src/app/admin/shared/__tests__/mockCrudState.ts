import { useEffect, useState } from 'react';
import type {
  CrudStateConfig,
  CrudStateReturn,
} from '@/hooks/admin/useCrudState';

type MutationKind = 'create' | 'update' | 'delete';

function applyTransform<TItem>(
  items: TItem[],
  transform?: (items: TItem[]) => TItem[],
): TItem[] {
  return transform ? transform(items) : items;
}

export interface CrudStateMockOptions<TItem> {
  initialItems?: TItem[];
  initialLoading?: boolean;
  initialError?: unknown;
}

export function buildCrudStateMock<TItem, TCreate, TUpdate, TIdentifier>(
  options: CrudStateMockOptions<TItem> = {},
) {
  const {
    initialItems = [],
    initialLoading = true,
    initialError = null,
  } = options;

  return jest.fn(
    (
      config: CrudStateConfig<TItem, TCreate, TUpdate, TIdentifier>,
    ): CrudStateReturn<TItem, TCreate, TUpdate, TIdentifier> => {
      const [items, setItems] = useState<TItem[]>(initialItems);
      const [isLoading, setIsLoading] = useState<boolean>(initialLoading);
      const [error, setError] = useState<unknown>(initialError);

      useEffect(() => {
        let cancelled = false;

        const fetchItems = async () => {
          setIsLoading(true);
          try {
            const fetchedItems = await config.fetchItems();
            if (cancelled) return;
            setItems(applyTransform(fetchedItems, config.transformItems));
            setError(null);
          } catch (fetchError) {
            if (cancelled) return;
            setError(fetchError);
          } finally {
            if (!cancelled) {
              setIsLoading(false);
            }
          }
        };

        void fetchItems();

        return () => {
          cancelled = true;
        };
      }, [config.fetchItems, config.transformItems]);

      const refreshItems = async () => {
        const fetchedItems = await config.fetchItems();
        const mapped = applyTransform(fetchedItems, config.transformItems);
        setItems(mapped);
        return mapped;
      };

      const runMutation = async <TValue>(
        mutation:
          | { mutationFn: (value: TValue) => Promise<unknown> }
          | undefined,
        value: TValue,
        type: MutationKind,
      ) => {
        if (!mutation) {
          throw new Error('Mutation not configured');
        }

        try {
          const result = await mutation.mutationFn(value);
          config.onSuccess?.[type]?.(value as never);
          await refreshItems();
          return result;
        } catch (mutationError) {
          config.onError?.[type]?.(mutationError);
          throw mutationError;
        }
      };

      const refetch = async () => {
        try {
          return await refreshItems();
        } catch (refetchError) {
          setError(refetchError);
          throw refetchError;
        }
      };

      return {
        items,
        isLoading,
        error,
        refetch,
        createMutation: { isPending: false } as unknown as CrudStateReturn<
          TItem,
          TCreate,
          TUpdate,
          TIdentifier
        >['createMutation'],
        updateMutation: { isPending: false } as unknown as CrudStateReturn<
          TItem,
          TCreate,
          TUpdate,
          TIdentifier
        >['updateMutation'],
        deleteMutation: { isPending: false } as unknown as CrudStateReturn<
          TItem,
          TCreate,
          TUpdate,
          TIdentifier
        >['deleteMutation'],
        executeCreate: (value: TCreate) =>
          runMutation(config.create, value, 'create'),
        executeUpdate: (value: TUpdate) =>
          runMutation(config.update, value, 'update'),
        executeDelete: (identifier: TIdentifier) =>
          runMutation(config.remove, identifier, 'delete'),
      };
    },
  );
}
