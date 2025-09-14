/** @jest-environment node */

import {
  fetchNavItems,
  createNavItem,
  updateNavItem,
  deleteNavItem,
} from '@/lib/api/nav';
import { server } from '@/test-utils/server';
import { mockSuccess } from '@/test-utils/handlers';

process.env.NEXT_PUBLIC_BASE_URL = '';

describe('nav api', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('constructs icons from API metadata', async () => {
    server.use(
      mockSuccess(
        [{ flag: 'lobby', href: '/', label: 'Lobby', icon: 'home' }],
        { once: true },
      ),
      mockSuccess(
        [
          {
            name: 'home',
            svg: '<svg viewBox="0 0 512 512"><path d="M0 0"/></svg>',
          },
        ],
        { once: true },
      ),
    );
    const items = await fetchNavItems();
    expect(items[0].icon).toBeDefined();
    expect(items[0].icon?.iconName).toBe('home');
  });

  it('omits unknown or invalid icons', async () => {
    server.use(
      mockSuccess(
        [{ flag: 'lobby', href: '/', label: 'Lobby', icon: 'missing' }],
        { once: true },
      ),
      mockSuccess([{ name: 'home' } as any], { once: true }),
    );
    const items = await fetchNavItems();
    expect(items[0].icon).toBeUndefined();
  });

  it('creates, updates and deletes nav items', async () => {
    server.use(
      mockSuccess(
        { flag: 'about', href: '/about', label: 'About' },
        { once: true },
      ),
    );
    await createNavItem({
      flag: 'about',
      href: '/about',
      label: 'About',
      order: 1,
    });
    expect(fetch).toHaveBeenLastCalledWith(
      expect.stringContaining('/api/nav-items'),
      expect.objectContaining({ method: 'POST' }),
    );

    server.use(
      mockSuccess(
        { flag: 'about', href: '/info', label: 'About' },
        { once: true },
      ),
    );
    await updateNavItem('about', {
      flag: 'about',
      href: '/info',
      label: 'About',
      order: 1,
    });
    expect(fetch).toHaveBeenLastCalledWith(
      expect.stringContaining('/api/nav-items/about'),
      expect.objectContaining({ method: 'PUT' }),
    );

    server.use(mockSuccess(null, { status: 204, once: true }));
    await deleteNavItem('about');
    expect(fetch).toHaveBeenLastCalledWith(
      expect.stringContaining('/api/nav-items/about'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
