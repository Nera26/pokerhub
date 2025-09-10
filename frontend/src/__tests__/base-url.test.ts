describe('getBaseUrl', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it('returns NEXT_PUBLIC_BASE_URL when provided', async () => {
    jest.doMock('../lib/env', () => ({
      __esModule: true,
      env: { NEXT_PUBLIC_BASE_URL: 'https://env.test' },
    }));
    const { getBaseUrl } = await import('../lib/base-url');
    expect(getBaseUrl()).toBe('https://env.test');
  });

  it('returns VERCEL_URL when NEXT_PUBLIC_BASE_URL is absent', async () => {
    jest.doMock('../lib/env', () => ({
      __esModule: true,
      env: { VERCEL_URL: 'vercel.test' },
    }));
    const { getBaseUrl } = await import('../lib/base-url');
    expect(getBaseUrl()).toBe('https://vercel.test');
  });

  it('throws when base URL cannot be resolved', async () => {
    jest.doMock('../lib/env', () => ({ __esModule: true, env: {} }));
    const originalWindow = (global as any).window;
    // Remove the window object to simulate server runtime
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (global as any).window;
    const { getBaseUrl } = await import('../lib/base-url');
    expect(() => getBaseUrl()).toThrow('Base URL could not be determined');
    (global as any).window = originalWindow;
  });
});
