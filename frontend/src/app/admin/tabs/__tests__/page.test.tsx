import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Page from '../page';

jest.mock('@/hooks/useRequireAdmin', () => ({
  useRequireAdmin: jest.fn(),
}));

jest.mock('@/lib/api/admin', () => ({
  fetchAdminTabs: jest.fn(),
  createAdminTab: jest.fn(),
  updateAdminTab: jest.fn(),
  deleteAdminTab: jest.fn(),
}));

import {
  fetchAdminTabs,
  createAdminTab,
  deleteAdminTab,
} from '@/lib/api/admin';
import type { AdminTab } from '@shared/types';
import type { CrudStateConfig } from '@/hooks/admin/useCrudState';

jest.mock('@/hooks/admin/useCrudState', () => {
  const React = require('react');
  return {
    useCrudState: jest.fn((config: CrudStateConfig<any, any, any, any>) => {
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
    }),
  };
});

describe('Admin tabs page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(fetchAdminTabs).mockResolvedValue([] as AdminTab[]);
  });

  function renderPage() {
    return render(<Page />);
  }

  it('requires an icon before submitting a new tab', async () => {
    const user = userEvent.setup();
    jest.mocked(fetchAdminTabs).mockResolvedValueOnce([]);
    jest.mocked(createAdminTab).mockResolvedValue({} as AdminTab);

    renderPage();

    await screen.findByText('No runtime admin tabs found.');

    await user.type(screen.getByLabelText('ID'), 'audit');
    await user.type(screen.getByLabelText('Title'), 'Audit');
    await user.type(
      screen.getByLabelText('Component'),
      '@/app/components/dashboard/Audit',
    );

    await user.click(screen.getByRole('button', { name: 'Create tab' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Icon is required',
    );
  });

  it('shows a progress state while deleting a tab', async () => {
    const user = userEvent.setup();
    jest
      .mocked(fetchAdminTabs)
      .mockResolvedValueOnce([
        {
          id: 'reports',
          title: 'Reports',
          component: '@/app/components/dashboard/Reports',
          icon: 'faChartLine',
        },
      ] as AdminTab[])
      .mockResolvedValueOnce([]);

    let resolveDelete: (() => void) | undefined;
    jest.mocked(deleteAdminTab).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveDelete = resolve;
        }),
    );

    renderPage();

    const deleteButton = await screen.findByRole('button', { name: 'Delete' });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(deleteButton).toBeDisabled();
      expect(deleteButton).toHaveTextContent('Deleting…');
    });

    resolveDelete?.();

    await screen.findByText('No runtime admin tabs found.');
  });
});
