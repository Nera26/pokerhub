import { createResourceHook } from '../createResourceHook';

jest.mock('../useApiQuery', () => ({
  createQueryHook: jest.fn(() => 'hook'),
}));

describe('createResourceHook', () => {
  it('constructs query with normalized label', () => {
    const fetcher = jest.fn();
    const { createQueryHook } = require('../useApiQuery');
    const result = createResourceHook('admin-messages', fetcher);
    expect(createQueryHook).toHaveBeenCalledWith(
      'admin-messages',
      fetcher,
      'admin messages',
    );
    expect(result).toBe('hook');
  });
});
