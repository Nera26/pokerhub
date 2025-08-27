import '@testing-library/jest-dom';

process.env.NEXT_PUBLIC_BASE_URL ??= 'http://localhost:3000';
process.env.NEXT_PUBLIC_SOCKET_URL ??= 'http://localhost:4000';
process.env.NEXT_INTL_CONFIG ??= 'next-intl.config.ts';

// Default mock for next/navigation.
// Individual tests can re-mock this as needed without conflicts.
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(''),
  useParams: () => ({}),
}));

// Quiet noisy console output during tests; restore afterward.
const originalError = console.error;
const originalCount = console.count;

beforeAll(() => {
  console.error = () => {};
  console.count = () => {};
});

afterAll(() => {
  console.error = originalError;
  console.count = originalCount;
});
