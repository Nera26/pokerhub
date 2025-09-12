/** @jest-environment node */

describe('/api/precache', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost';
  });

  afterEach(() => {
    process.env = { ...OLD_ENV } as NodeJS.ProcessEnv;
  });

  async function loadRoute() {
    const mod = await import('@/app/api/precache/route');
    return mod.GET;
  }

  it('returns manifest urls on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ['/', '/favicon.ico'],
    }) as any;

    const GET = await loadRoute();
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual(['/', '/favicon.ico']);
  });

  it('returns empty array when backend empty', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    }) as any;

    const GET = await loadRoute();
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual([]);
  });

  it('returns empty array when backend error', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as any;

    const GET = await loadRoute();
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual([]);
  });
});
