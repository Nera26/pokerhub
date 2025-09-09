import { EventSchemas, type EventName, type Events } from '@shared/events';

export function validateEvent<T extends EventName>(name: T, payload: unknown): Events[T] {
  const schema = EventSchemas[name];
  return schema.parse(payload);
}

export { EventSchemas };
export type { EventName, Events };
