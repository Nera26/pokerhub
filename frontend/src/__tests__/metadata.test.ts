jest.mock('@/lib/base-url', () => ({ getBaseUrl: () => 'http://base' }));

describe('buildMetadata', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('falls back to defaults on fetch failure', async () => {
    (global as any).fetch = jest.fn().mockRejectedValue(new Error('fail'));
    const { buildMetadata } = await import('@/lib/metadata');
    const meta = await buildMetadata();
    expect(meta).toEqual({
      title: 'PokerHub',
      description: "Live Texas Hold'em, Omaha & Tournaments — PokerHub",
      image: 'http://base/pokerhub-logo.svg',
      url: 'http://base',
    });
    expect((global as any).fetch).toHaveBeenCalledTimes(1);
  });

  it('caches API response', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        title: 'T',
        description: 'D',
        imagePath: '/img.png',
      }),
    });
    const { buildMetadata } = await import('@/lib/metadata');
    const first = await buildMetadata();
    const second = await buildMetadata();
    expect((global as any).fetch).toHaveBeenCalledTimes(1);
    expect(first).toEqual({
      title: 'T',
      description: 'D',
      image: 'http://base/img.png',
      url: 'http://base',
    });
    expect(second).toEqual(first);
  });
});
