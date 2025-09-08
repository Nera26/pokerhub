import { createValidators } from '../../src/analytics/validator';
import { EventSchemas } from '@shared/events';
import Ajv from 'ajv';

describe('createValidators', () => {
  it('compiles all event schemas', () => {
    const { ajv, validators } = createValidators();
    expect(ajv).toBeInstanceOf(Ajv);
    expect(Object.keys(validators)).toHaveLength(
      Object.keys(EventSchemas).length,
    );
    const validate = validators['hand.start'];
    expect(validate({
      handId: '123e4567-e89b-12d3-a456-426614174000',
      tableId: '123e4567-e89b-12d3-a456-426614174001',
      players: ['123e4567-e89b-12d3-a456-426614174002'],
    })).toBe(true);
  });
});
