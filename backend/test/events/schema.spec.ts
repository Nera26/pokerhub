import { EventSchemas } from '@shared/events';
import { randomUUID } from 'crypto';

describe('event schemas', () => {
  it('validates hand.start', () => {
    const payload = { handId: randomUUID(), players: [randomUUID()] };
    expect(() => EventSchemas['hand.start'].parse(payload)).not.toThrow();
  });

  it('rejects invalid wallet.credit', () => {
    expect(() =>
      EventSchemas['wallet.credit'].parse({
        accountId: 'no-uuid',
        amount: '5',
      }),
    ).toThrow();
  });
});
