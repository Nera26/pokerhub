/** @jest-environment node */

import { fetchNavItems } from '@/lib/api/nav';
import { mockFetch } from '@/test-utils/mockFetch';

process.env.NEXT_PUBLIC_BASE_URL = '';

describe('nav api', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('constructs icons from API metadata', async () => {
    mockFetch(
      {
        status: 200,
        payload: [{ flag: 'lobby', href: '/', label: 'Lobby', icon: 'home' }],
      },
      {
        status: 200,
        payload: [
          {
            name: 'home',
            svg: '<svg viewBox="0 0 512 512"><path d="M0 0"/></svg>',
          },
        ],
      },
    );
    const items = await fetchNavItems();
    expect(items[0].icon).toBeDefined();
    expect(items[0].icon?.iconName).toBe('home');
  });

  it('omits unknown or invalid icons', async () => {
    mockFetch(
      {
        status: 200,
        payload: [
          { flag: 'lobby', href: '/', label: 'Lobby', icon: 'missing' },
        ],
      },
      { status: 200, payload: [{ name: 'home' }] as any },
    );
    const items = await fetchNavItems();
    expect(items[0].icon).toBeUndefined();
  });
});
