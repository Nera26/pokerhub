/** @jest-environment node */
import { getStatus } from './status';

describe('getStatus', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns fallback status on fetch failure', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('fail'));
    await expect(getStatus()).resolves.toEqual({
      status: 'error',
      contractVersion: 'unknown',
    });
  });
});
