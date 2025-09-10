import { AuditLogsResponseSchema } from '@shared/schemas/analytics';

describe('AuditLogsResponseSchema', () => {
  it('parses a valid response', () => {
    const data = {
      logs: [
        {
          id: 1,
          timestamp: new Date().toISOString(),
          type: 'Login',
          description: 'User logged in',
          user: 'alice',
          ip: '127.0.0.1',
        },
      ],
      total: 1,
    };
    expect(() => AuditLogsResponseSchema.parse(data)).not.toThrow();
  });

  it('rejects an invalid response', () => {
    const bad = { logs: [{ id: 'oops' }] } as any;
    expect(() => AuditLogsResponseSchema.parse(bad)).toThrow();
  });
});
