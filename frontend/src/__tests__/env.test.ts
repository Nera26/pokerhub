describe('env validation', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV } as NodeJS.ProcessEnv;
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('defaults NODE_ENV to development when missing', async () => {
    delete (process.env as Record<string, string | undefined>).NODE_ENV;
    const mod = await import('../lib/env');
    expect(mod.env.NODE_ENV).toBe('development');
  });

  it('throws if NEXT_PUBLIC_SOCKET_URL is malformed', async () => {
    (process.env as Record<string, string | undefined>).NEXT_PUBLIC_SOCKET_URL =
      'invalid-url';
    await expect(import('../lib/env')).rejects.toThrow(
      /NEXT_PUBLIC_SOCKET_URL/,
    );
  });

  it('throws if NEXT_PUBLIC_BASE_URL and VERCEL_URL are missing outside development', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    delete (process.env as Record<string, string | undefined>)
      .NEXT_PUBLIC_BASE_URL;
    delete (process.env as Record<string, string | undefined>).VERCEL_URL;
    (process.env as Record<string, string | undefined>).NEXT_PUBLIC_SOCKET_URL =
      'http://localhost:4000';
    await expect(import('../lib/env')).rejects.toThrow(/NEXT_PUBLIC_BASE_URL/);
  });

  it('throws if NEXT_PUBLIC_SOCKET_URL cannot be derived', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    delete (process.env as Record<string, string | undefined>)
      .NEXT_PUBLIC_SOCKET_URL;
    delete (process.env as Record<string, string | undefined>)
      .NEXT_PUBLIC_BASE_URL;
    delete (process.env as Record<string, string | undefined>).VERCEL_URL;
    await expect(import('../lib/env')).rejects.toThrow(
      /NEXT_PUBLIC_SOCKET_URL/,
    );
  });
});
