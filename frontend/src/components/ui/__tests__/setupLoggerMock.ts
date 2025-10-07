export default jest.mock('@/lib/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    log: jest.fn(),
    debug: jest.fn(),
  },
}));

test('logger mock setup', () => {
  expect(true).toBe(true);
});
