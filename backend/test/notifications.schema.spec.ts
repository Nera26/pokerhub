import { NotificationsResponseSchema } from '@shared/types';

describe('NotificationsResponseSchema', () => {
  it('parses a valid response', () => {
    const data = {
      notifications: [
        {
          id: '1',
          type: 'system',
          title: 'title',
          message: 'msg',
          timestamp: new Date().toISOString(),
          read: false,
        },
      ],
    };
    expect(() => NotificationsResponseSchema.parse(data)).not.toThrow();
  });

  it('rejects an invalid response', () => {
    const bad = { notifications: [{ id: 123 }] } as any;
    expect(() => NotificationsResponseSchema.parse(bad)).toThrow();
  });
});
