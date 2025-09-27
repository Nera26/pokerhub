describe('pqueue-loader', () => {
  const originalFunction = global.Function;
  const originalEval = global.eval;

  afterEach(() => {
    global.Function = originalFunction;
    jest.resetModules();
    jest.clearAllMocks();
    jest.restoreAllMocks();
    jest.unmock('p-queue');
    global.eval = originalEval;
  });

  it('uses the jest CJS mock via eval(require) when dynamic import fails', async () => {
    const fakeCtor = jest.fn();
    const requireShim = jest.fn(() => ({ default: fakeCtor }));
    const dynamicImportMock = jest.fn(() => {
      throw new SyntaxError('Unexpected token export');
    });

    jest.doMock('p-queue', () => ({ default: fakeCtor }));

    const evalSpy = jest
      .spyOn(global, 'eval')
      .mockImplementation(((code: string) => {
        if (code === 'require') {
          return requireShim;
        }

        return originalEval(code);
      }) as typeof global.eval);

    (global as unknown as { Function: jest.Mock }).Function = jest
      .fn(() => dynamicImportMock)
      .mockName('DynamicImportShimFactory');

    const { loadPQueue } = require('../../src/game/pqueue-loader');

    await expect(loadPQueue()).resolves.toBe(fakeCtor);

    expect(dynamicImportMock).toHaveBeenCalledWith('p-queue');
    expect(requireShim).toHaveBeenCalledWith('p-queue');
    evalSpy.mockRestore();
  });

  it('falls back to CommonJS when dynamic import throws the ERR_VM dynamic import TypeError', async () => {
    const fakeCtor = jest.fn();
    const requireShim = jest.fn(() => ({ default: fakeCtor }));
    const dynamicImportMock = jest.fn(() => {
      throw new TypeError('A dynamic import callback was invoked without --experimental-vm-modules');
    });

    jest.doMock('p-queue', () => ({ default: fakeCtor }));

    const evalSpy = jest
      .spyOn(global, 'eval')
      .mockImplementation(((code: string) => {
        if (code === 'require') {
          return requireShim;
        }

        return originalEval(code);
      }) as typeof global.eval);

    (global as unknown as { Function: jest.Mock }).Function = jest
      .fn(() => dynamicImportMock)
      .mockName('DynamicImportShimFactory');

    const { loadPQueue } = require('../../src/game/pqueue-loader');

    await expect(loadPQueue()).resolves.toBe(fakeCtor);

    expect(dynamicImportMock).toHaveBeenCalledWith('p-queue');
    expect(requireShim).toHaveBeenCalledWith('p-queue');
    evalSpy.mockRestore();
  });

  it('loads the constructor via dynamic import when available', async () => {
    const fakeCtor = jest.fn();
    const dynamicImportMock = jest
      .fn(async () => ({ default: fakeCtor }))
      .mockName('DynamicImportMock');
    const evalSpy = jest.spyOn(global, 'eval');

    (global as unknown as { Function: jest.Mock }).Function = jest
      .fn(() => dynamicImportMock)
      .mockName('DynamicImportShimFactory');

    const { loadPQueue } = require('../../src/game/pqueue-loader');

    await expect(loadPQueue()).resolves.toBe(fakeCtor);
    await expect(loadPQueue()).resolves.toBe(fakeCtor);

    expect(dynamicImportMock).toHaveBeenCalledTimes(1);
    expect(dynamicImportMock).toHaveBeenCalledWith('p-queue');
    expect(evalSpy).not.toHaveBeenCalledWith('require');
  });
});
