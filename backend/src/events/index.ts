import { EventSchemas, type EventName, type Events } from '@shared/events';

type EventSchemaMap = Record<string, { parse(value: unknown): unknown }>;

export function validateEvent<T extends EventName>(name: T, payload: unknown): Events[T] {
  const schema = (EventSchemas as EventSchemaMap | undefined)?.[name];
  if (!schema) {
    return payload as Events[T];
  }
  return schema.parse(payload) as Events[T];
}

export { EventSchemas };
export type { EventName, Events };
