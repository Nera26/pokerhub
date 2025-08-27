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

  it('defaults NEXT_PUBLIC_BASE_URL when missing outside development', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    delete (process.env as Record<string, string | undefined>)
      .NEXT_PUBLIC_BASE_URL;
    const mod = await import('../lib/env');
    expect(mod.env.NEXT_PUBLIC_BASE_URL).toBe('http://localhost:3000');
  });

  it('defaults NEXT_PUBLIC_SOCKET_URL when missing outside development', async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    delete (process.env as Record<string, string | undefined>)
      .NEXT_PUBLIC_SOCKET_URL;
    const mod = await import('../lib/env');
    expect(mod.env.NEXT_PUBLIC_SOCKET_URL).toBe('http://localhost:4000');
  });
});
