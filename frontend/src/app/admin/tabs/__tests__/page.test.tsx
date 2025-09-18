import { fireEvent, screen, waitFor } from '@testing-library/react';
import AdminTabsPage from '../page';
import { renderWithClient } from '@/app/components/dashboard/__tests__/renderWithClient';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import {
  fetchAdminTabs,
  createAdminTab,
  updateAdminTab,
} from '@/lib/api/admin';
import type { AdminTab } from '@shared/types';

jest.mock('@/hooks/useRequireAdmin', () => ({
  useRequireAdmin: jest.fn(),
}));

jest.mock('@/lib/api/admin', () => ({
  fetchAdminTabs: jest.fn(),
  createAdminTab: jest.fn(),
  updateAdminTab: jest.fn(),
}));

type FetchAdminTabs = typeof fetchAdminTabs;
const mockFetchAdminTabs =
  fetchAdminTabs as jest.MockedFunction<FetchAdminTabs>;
const mockCreateAdminTab = createAdminTab as jest.MockedFunction<
  typeof createAdminTab
>;
const mockUpdateAdminTab = updateAdminTab as jest.MockedFunction<
  typeof updateAdminTab
>;
const mockUseRequireAdmin = useRequireAdmin as jest.MockedFunction<
  typeof useRequireAdmin
>;

describe('AdminTabsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchAdminTabs.mockResolvedValue([]);
  });

  it('requires admin access', async () => {
    renderWithClient(<AdminTabsPage />);

    await waitFor(() => expect(mockFetchAdminTabs).toHaveBeenCalled());
    expect(mockUseRequireAdmin).toHaveBeenCalled();
  });

  it('rejects empty icon when creating and succeeds with a value', async () => {
    mockCreateAdminTab.mockResolvedValue({
      id: 'reports',
      title: 'Reports',
      component: '@/components/Reports',
      icon: 'faChartBar',
      source: 'database',
    } as AdminTab);

    renderWithClient(<AdminTabsPage />);
    await screen.findByLabelText(/ID/i);

    fireEvent.change(screen.getByLabelText(/ID/i), {
      target: { value: 'reports' },
    });
    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: 'Reports' },
    });
    fireEvent.change(screen.getByLabelText(/Component/i), {
      target: { value: '@/components/Reports' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Create tab/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Icon is required',
    );
    expect(mockCreateAdminTab).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/Icon/i), {
      target: { value: ' faChartLine ' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Create tab/i }));

    await waitFor(() =>
      expect(mockCreateAdminTab).toHaveBeenCalledWith({
        id: 'reports',
        title: 'Reports',
        component: '@/components/Reports',
        icon: 'faChartLine',
      }),
    );

    await waitFor(() => expect(screen.getByLabelText(/Icon/i)).toHaveValue(''));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('rejects empty icon when updating and succeeds with a value', async () => {
    const existing: AdminTab = {
      id: 'events',
      title: 'Events',
      component: '@/components/Events',
      icon: undefined,
      source: 'database',
    } as AdminTab;
    mockFetchAdminTabs.mockResolvedValue([existing]);
    mockUpdateAdminTab.mockResolvedValue({
      ...existing,
      icon: 'faBell',
    });

    renderWithClient(<AdminTabsPage />);
    const editButton = await screen.findByRole('button', { name: 'Edit' });

    fireEvent.click(editButton);

    const iconInput = screen.getByLabelText(/Icon/i) as HTMLInputElement;
    expect(iconInput.value).toBe('');

    fireEvent.click(screen.getByRole('button', { name: /Update tab/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Icon is required',
    );
    expect(mockUpdateAdminTab).not.toHaveBeenCalled();

    fireEvent.change(iconInput, { target: { value: ' faBell ' } });

    fireEvent.click(screen.getByRole('button', { name: /Update tab/i }));

    await waitFor(() =>
      expect(mockUpdateAdminTab).toHaveBeenCalledWith('events', {
        title: 'Events',
        component: '@/components/Events',
        icon: 'faBell',
      }),
    );

    await waitFor(() => expect(screen.getByLabelText(/Icon/i)).toHaveValue(''));
    expect(screen.getByLabelText(/ID/i)).toHaveValue('');
  });
});
