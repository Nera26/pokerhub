import { OptionSchema } from '@shared/option.schema';
import { BonusOptionsResponseSchema } from '../../src/schemas/bonus';

describe('Bonus option schema', () => {
  const option = { value: 'deposit', label: 'Deposit' } as const;

  it('parses the shared option shape', () => {
    expect(OptionSchema.parse(option)).toEqual(option);
  });

  it('parses bonus options using the shared option schema', () => {
    const response = {
      types: [option],
      eligibilities: [option],
      statuses: [option],
    };

    expect(BonusOptionsResponseSchema.parse(response)).toEqual(response);
  });

  it('rejects invalid options in the response', () => {
    const invalidResponse = {
      types: [option],
      eligibilities: [{ value: 'vip' }],
      statuses: [option],
    };

    expect(() => BonusOptionsResponseSchema.parse(invalidResponse)).toThrow();
  });
});
