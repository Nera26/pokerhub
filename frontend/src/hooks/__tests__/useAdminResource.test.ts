import { createAdminResource } from '../useAdminResource';

jest.mock('../useApiQuery', () => ({
  createQueryHook: jest.fn(() => 'hook'),
}));

describe('createAdminResource', () => {
  it('constructs query with normalized label', () => {
    const fetcher = jest.fn();
    const { createQueryHook } = require('../useApiQuery');
    const result = createAdminResource('admin-messages', fetcher);
    expect(createQueryHook).toHaveBeenCalledWith(
      'admin-messages',
      expect.any(Function),
      'admin messages',
    );
    expect(result).toBe('hook');
  });
});
