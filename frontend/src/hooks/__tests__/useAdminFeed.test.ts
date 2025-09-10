import { createAdminFeedHook } from '../useAdminFeed';

describe('createAdminFeedHook', () => {
  it('exposes queryKey on returned hook', () => {
    const hook = createAdminFeedHook(
      'test-key',
      async (_client, _opts) => [],
      'test',
    );
    expect(hook.queryKey).toEqual(['test-key']);
  });
});
