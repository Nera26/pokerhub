import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Page from '../page';

jest.mock('@/hooks/useRequireAdmin', () => ({
  useRequireAdmin: jest.fn(),
}));

jest.mock('@/lib/api/nav', () => ({
  fetchNavItems: jest.fn(),
  createNavItem: jest.fn(),
  updateNavItem: jest.fn(),
  deleteNavItem: jest.fn(),
}));

import {
  fetchNavItems,
  createNavItem,
  updateNavItem,
  deleteNavItem,
} from '@/lib/api/nav';
import type { NavItem as UiNavItem } from '@/lib/api/nav';

jest.mock('@/hooks/admin/useCrudState', () => {
  const { buildCrudStateMock } =
    require('../../shared/__tests__/mockCrudState') as typeof import('../../shared/__tests__/mockCrudState');
  return {
    useCrudState: jest.fn(buildCrudStateMock()),
  };
});

describe('Nav admin page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(fetchNavItems).mockResolvedValue([] as UiNavItem[]);
  });

  function renderPage() {
    return render(<Page />);
  }

  it('shows a validation error when order is not an integer', async () => {
    const user = userEvent.setup();
    jest.mocked(fetchNavItems).mockResolvedValueOnce([]);
    jest.mocked(createNavItem).mockResolvedValue({} as UiNavItem);

    renderPage();

    await screen.findByText('No navigation items found.');

    await user.type(screen.getByLabelText('Flag'), 'news');
    await user.type(screen.getByLabelText('Href'), '/news');
    await user.type(screen.getByLabelText('Label'), 'News');

    const orderInput = screen.getByLabelText('Order') as HTMLInputElement;
    await user.clear(orderInput);
    await user.type(orderInput, '2.5');

    await user.click(screen.getByRole('button', { name: 'Create item' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Order must be an integer',
    );
  });

  it('prefills fields for edit and resets to defaults after cancel', async () => {
    const user = userEvent.setup();
    jest.mocked(fetchNavItems).mockResolvedValueOnce([
      {
        flag: 'home',
        href: '/',
        label: 'Home',
        order: 1,
      },
      {
        flag: 'support',
        href: '/support',
        label: 'Support',
        order: 2,
      },
    ] as UiNavItem[]);
    jest.mocked(updateNavItem).mockResolvedValue({} as UiNavItem);

    renderPage();

    await screen.findByText('Home');

    const orderInput = screen.getByLabelText('Order') as HTMLInputElement;
    await waitFor(() => expect(orderInput.value).toBe('3'));

    const editButtons = screen.getAllByRole('button', { name: 'Edit' });
    await user.click(editButtons[0]);

    const flagInput = screen.getByLabelText('Flag') as HTMLInputElement;
    await waitFor(() => expect(flagInput.value).toBe('home'));
    expect(flagInput).toHaveAttribute('readonly');

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(flagInput.value).toBe(''));
    expect(flagInput).not.toHaveAttribute('readonly');
    await waitFor(() => expect(orderInput.value).toBe('3'));
  });

  it('disables delete button while a deletion is in progress', async () => {
    const user = userEvent.setup();
    jest.mocked(fetchNavItems).mockResolvedValue([
      {
        flag: 'home',
        href: '/',
        label: 'Home',
        order: 1,
      },
    ] as UiNavItem[]);

    let resolveDelete: (() => void) | undefined;
    jest.mocked(deleteNavItem).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveDelete = resolve;
        }),
    );

    renderPage();

    const deleteButton = await screen.findByRole('button', { name: 'Delete' });
    await user.click(deleteButton);

    expect(deleteButton).toBeDisabled();

    resolveDelete?.();
  });
});
