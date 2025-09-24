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

jest.mock('@/hooks/admin/useCrudState', () => {
  const { buildCrudStateMock } =
    require('../../shared/__tests__/mockCrudState') as typeof import('../../shared/__tests__/mockCrudState');
  return {
    useCrudState: jest.fn(buildCrudStateMock()),
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
