import {
  NotificationFiltersResponseSchema,
  NotificationsResponseSchema,
} from '@shared/types';

describe('NotificationsResponseSchema', () => {
  it('parses a valid response', () => {
    const data = {
      contractVersion: '1.0.0',
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

describe('NotificationFiltersResponseSchema', () => {
  it('parses valid filter options', () => {
    const options = {
      contractVersion: '1.0.0',
      filters: [
        { label: 'Bonuses', value: 'bonus' },
        { label: 'System', value: 'system' },
      ],
    };
    expect(() => NotificationFiltersResponseSchema.parse(options)).not.toThrow();
  });

  it('rejects invalid filter options', () => {
    const invalid = {
      contractVersion: '1.0.0',
      filters: [{ label: 123, value: 'bonus' }],
    } as any;
    expect(() => NotificationFiltersResponseSchema.parse(invalid)).toThrow();
  });
});
