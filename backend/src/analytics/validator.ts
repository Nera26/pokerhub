import Ajv, { ValidateFunction } from 'ajv';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { EventSchemas, EventName } from '@shared/events';

export function createValidators(): {
  ajv: Ajv;
  validators: Record<EventName, ValidateFunction>;
} {
  const ajv = new Ajv();
  ajv.addFormat(
    'uuid',
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );
  const validators = {} as Record<EventName, ValidateFunction>;
  for (const [name, schema] of Object.entries(EventSchemas)) {
    validators[name as EventName] = ajv.compile(zodToJsonSchema(schema, name));
  }
  return { ajv, validators };
}
