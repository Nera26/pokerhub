import { EventSchemas, type EventName } from '@shared/events';
import { randomUUID } from 'crypto';
import { validateEvent } from '../../src/events';

describe('event schemas', () => {
  it('validates hand.start', () => {
    const payload = { handId: randomUUID(), players: [randomUUID()] };
    expect(() => validateEvent('hand.start', payload)).not.toThrow();
  });

  it.each(Object.keys(EventSchemas) as EventName[])(
    'rejects invalid %s payload',
    (name) => {
      expect(() => validateEvent(name, {})).toThrow();
    },
  );
});
