import { isValidEmail } from '@/lib/validators';

describe('validators', () => {
  it('checks email validity', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('invalid')).toBe(false);
  });
});
