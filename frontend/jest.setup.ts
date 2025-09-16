import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';
import type {
  Headers as UndiciHeaders,
  Request as UndiciRequest,
  Response as UndiciResponse,
} from 'undici';
import { server } from '@/test-utils/server';

let undici: typeof import('undici') | undefined;

function ensureUndici() {
  if (!undici) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    undici = require('undici');
  }
  return undici;
}

if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder =
    TextEncoder as unknown as typeof globalThis.TextEncoder;
}

if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder =
    TextDecoder as unknown as typeof globalThis.TextDecoder;
}

if (typeof globalThis.Response === 'undefined') {
  const { Response } = ensureUndici() as { Response: UndiciResponse };
  globalThis.Response = Response as unknown as typeof globalThis.Response;
}

if (typeof globalThis.Request === 'undefined') {
  const { Request } = ensureUndici() as { Request: UndiciRequest };
  globalThis.Request = Request as unknown as typeof globalThis.Request;
}

if (typeof globalThis.Headers === 'undefined') {
  const { Headers } = ensureUndici() as { Headers: UndiciHeaders };
  globalThis.Headers = Headers as unknown as typeof globalThis.Headers;
}

process.env.NEXT_PUBLIC_BASE_URL ??= 'http://localhost:3000';
process.env.NEXT_PUBLIC_SOCKET_URL ??= 'http://localhost:4000';

const realFetch = global.fetch;
global.fetch = jest.fn((...args) =>
  realFetch(...args),
) as unknown as typeof fetch;

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
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  console.error = originalError;
  console.count = originalCount;
  server.close();
});
