import { createAdminResource } from '../useAdminResource';

jest.mock('../useAdminQuery', () => ({
  createAdminQuery: jest.fn(() => 'hook'),
}));

describe('createAdminResource', () => {
  it('constructs query with normalized label', () => {
    const fetcher = jest.fn();
    const { createAdminQuery } = require('../useAdminQuery');
    const result = createAdminResource('admin-messages', fetcher);
    expect(createAdminQuery).toHaveBeenCalledWith(
      'admin-messages',
      fetcher,
      'admin messages',
    );
    expect(result).toBe('hook');
  });
});
