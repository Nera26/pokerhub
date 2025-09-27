describe('pqueue-loader', () => {
  const originalFunction = global.Function;

  afterEach(() => {
    global.Function = originalFunction;
    jest.resetModules();
    jest.clearAllMocks();
    jest.restoreAllMocks();
    jest.unmock('node:module');
    jest.unmock('p-queue');
  });

  it('falls back to createRequire when require throws SyntaxError', async () => {
    const fakeCtor = jest.fn();
    const requireShim = jest.fn(() => ({ default: fakeCtor }));
    const createRequireMock = jest.fn(() => requireShim);

    jest.doMock('node:module', () => {
      const actual = jest.requireActual('node:module');
      return { ...actual, createRequire: createRequireMock };
    });

    jest.doMock('p-queue', () => {
      throw new SyntaxError('Unexpected token export');
    });

    const dynamicImportMock = jest.fn(() => {
      throw new SyntaxError('Unexpected token export');
    });

    (global as unknown as { Function: jest.Mock }).Function = jest
      .fn(() => dynamicImportMock)
      .mockName('DynamicImportShimFactory');

    const { loadPQueue } = require('../../src/game/pqueue-loader');

    await expect(loadPQueue()).resolves.toBe(fakeCtor);

    expect(dynamicImportMock).toHaveBeenCalledWith('p-queue');
    expect(createRequireMock).toHaveBeenCalledTimes(1);
    expect(requireShim).toHaveBeenCalledWith('p-queue');
  });
});
