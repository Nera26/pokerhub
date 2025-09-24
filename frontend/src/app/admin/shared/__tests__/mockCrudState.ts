import type { CrudStateConfig } from '@/hooks/admin/useCrudState';

export function buildCrudStateMock() {
  const React = require('react');

  return jest.fn((config: CrudStateConfig<any, any, any, any>) => {
    const { useEffect, useState } = React as typeof import('react');
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<unknown>(null);

    useEffect(() => {
      let cancelled = false;
      (async () => {
        try {
          const result = await config.fetchItems();
          if (cancelled) return;
          const mapped = config.transformItems
            ? config.transformItems(result)
            : result;
          setItems(mapped);
          setIsLoading(false);
        } catch (fetchError) {
          if (cancelled) return;
          setError(fetchError);
          setIsLoading(false);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [config.fetchItems, config.transformItems]);

    const runMutation = async (
      mutation: { mutationFn: (value: any) => Promise<unknown> } | undefined,
      value: any,
      type: 'create' | 'update' | 'delete',
    ) => {
      if (!mutation) {
        throw new Error('Mutation not configured');
      }
      try {
        const result = await mutation.mutationFn(value);
        config.onSuccess?.[type]?.(value);
        const refreshed = await config.fetchItems();
        const mapped = config.transformItems
          ? config.transformItems(refreshed)
          : refreshed;
        setItems(mapped);
        return result;
      } catch (mutationError) {
        config.onError?.[type]?.(mutationError);
        throw mutationError;
      }
    };

    return {
      items,
      isLoading,
      error,
      refetch: async () => {
        const result = await config.fetchItems();
        const mapped = config.transformItems
          ? config.transformItems(result)
          : result;
        setItems(mapped);
      },
      createMutation: { isPending: false },
      updateMutation: { isPending: false },
      deleteMutation: { isPending: false },
      executeCreate: (value: any) =>
        runMutation(config.create, value, 'create'),
      executeUpdate: (value: any) =>
        runMutation(config.update, value, 'update'),
      executeDelete: (value: any) =>
        runMutation(config.remove, value, 'delete'),
    };
  });
}
