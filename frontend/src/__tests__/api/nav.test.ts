/** @jest-environment node */

import {
  fetchNavItems,
  createNavItem,
  updateNavItem,
  deleteNavItem,
} from '@/lib/api/nav';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer();
const fetchSpy = jest.fn((input: RequestInfo, init?: RequestInit) =>
  server.fetch(input, init),
);

beforeAll(() => {
  server.listen();
  // @ts-expect-error override for tests
  global.fetch = fetchSpy;
});

afterEach(() => {
  server.resetHandlers();
  fetchSpy.mockReset();
});

afterAll(() => {
  server.close();
});

process.env.NEXT_PUBLIC_BASE_URL = '';

describe('nav api', () => {
  it('constructs icons from API metadata', async () => {
    server.use(
      http.get('http://localhost:3000/api/nav-items', () =>
        HttpResponse.json([
          { flag: 'lobby', href: '/', label: 'Lobby', icon: 'home' },
        ]),
      ),
      http.get('http://localhost:3000/api/nav-icons', () =>
        HttpResponse.json([
          {
            name: 'home',
            svg: '<svg viewBox="0 0 512 512"><path d="M0 0"/></svg>',
          },
        ]),
      ),
    );
    const items = await fetchNavItems();
    expect(items[0].icon).toBeDefined();
    expect(items[0].icon?.iconName).toBe('home');
  });

  it('omits unknown or invalid icons', async () => {
    server.use(
      http.get('http://localhost:3000/api/nav-items', () =>
        HttpResponse.json([
          { flag: 'lobby', href: '/', label: 'Lobby', icon: 'missing' },
        ]),
      ),
      http.get('http://localhost:3000/api/nav-icons', () =>
        HttpResponse.json([{ name: 'home' }] as any),
      ),
    );
    const items = await fetchNavItems();
    expect(items[0].icon).toBeUndefined();
  });

  it('creates, updates and deletes nav items', async () => {
    server.use(
      http.post('http://localhost:3000/api/nav-items', () =>
        HttpResponse.json({ flag: 'about', href: '/about', label: 'About' }),
      ),
      http.put('http://localhost:3000/api/nav-items/about', () =>
        HttpResponse.json({ flag: 'about', href: '/info', label: 'About' }),
      ),
      http.delete('http://localhost:3000/api/nav-items/about', () =>
        HttpResponse.json(null, { status: 204 }),
      ),
    );
    await createNavItem({
      flag: 'about',
      href: '/about',
      label: 'About',
      order: 1,
    });
    expect(fetchSpy).toHaveBeenLastCalledWith(
      expect.stringContaining('/api/nav-items'),
      expect.objectContaining({ method: 'POST' }),
    );

    await updateNavItem('about', {
      flag: 'about',
      href: '/info',
      label: 'About',
      order: 1,
    });
    expect(fetchSpy).toHaveBeenLastCalledWith(
      expect.stringContaining('/api/nav-items/about'),
      expect.objectContaining({ method: 'PUT' }),
    );

    await deleteNavItem('about');
    expect(fetchSpy).toHaveBeenLastCalledWith(
      expect.stringContaining('/api/nav-items/about'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
