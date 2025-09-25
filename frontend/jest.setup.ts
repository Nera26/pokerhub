import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';
let undici: typeof import('undici') | undefined;

function ensureUndici(): typeof import('undici') {
  if (!undici) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    undici = require('undici') as typeof import('undici');
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
  const { Response } = ensureUndici();
  globalThis.Response = Response as unknown as typeof globalThis.Response;
}

if (typeof globalThis.Request === 'undefined') {
  const { Request } = ensureUndici();
  globalThis.Request = Request as unknown as typeof globalThis.Request;
}

if (typeof globalThis.Headers === 'undefined') {
  const { Headers } = ensureUndici();
  globalThis.Headers = Headers as unknown as typeof globalThis.Headers;
}

if (typeof globalThis.BroadcastChannel === 'undefined') {
  class MockBroadcastChannel {
    name: string;
    onmessage: ((event: MessageEvent) => void) | null = null;

    constructor(name: string) {
      this.name = name;
    }

    postMessage(): void {}
    close(): void {}
    addEventListener(): void {}
    removeEventListener(): void {}
  }

  globalThis.BroadcastChannel =
    MockBroadcastChannel as unknown as typeof BroadcastChannel;
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { server } = require('@/test-utils/server') as {
  server: {
    listen: () => void;
    resetHandlers: () => void;
    close: () => void;
    use: (...handlers: unknown[]) => void;
  };
};

process.env.NEXT_PUBLIC_BASE_URL ??= 'http://localhost:3000';
process.env.NEXT_PUBLIC_SOCKET_URL ??= 'http://localhost:4000';

const realFetch = global.fetch;
const fetchMock: jest.MockedFunction<typeof fetch> = jest.fn((...args) =>
  realFetch(...args),
);

global.fetch = fetchMock;

export { fetchMock as mockFetch };

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
