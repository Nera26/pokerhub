describe('getBaseUrl', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it('falls back to window.location.origin in client runtime', async () => {
    const originalLocation = window.location;
    const origin = 'https://client.test';

    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, origin },
      configurable: true,
    });

    jest.doMock('../lib/env', () => ({ env: {} }));

    const { getBaseUrl } = await import('../lib/base-url');
    expect(getBaseUrl()).toBe(origin);

    Object.defineProperty(window, 'location', {
      value: originalLocation,
      configurable: true,
    });
  });
});

