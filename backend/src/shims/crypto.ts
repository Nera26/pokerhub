import * as nodeCrypto from 'node:crypto';

type CryptoWithRandomUUID = {
  randomUUID: typeof nodeCrypto.randomUUID;
  [key: string]: unknown;
};

const globalWithCrypto = globalThis as typeof globalThis & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  crypto?: any;
};

const ensureGlobalCrypto = () => {
  const existing = globalWithCrypto.crypto as CryptoWithRandomUUID | undefined;

  if (existing) {
    if (typeof existing.randomUUID !== 'function') {
      Object.defineProperty(existing, 'randomUUID', {
        value: nodeCrypto.randomUUID.bind(nodeCrypto),
        configurable: true,
        writable: false,
      });
    }
    return existing as CryptoWithRandomUUID;
  }

  const fallback =
    (nodeCrypto.webcrypto as unknown as CryptoWithRandomUUID | undefined) ??
    ({} as CryptoWithRandomUUID);

  if (typeof fallback.randomUUID !== 'function') {
    Object.defineProperty(fallback, 'randomUUID', {
      value: nodeCrypto.randomUUID.bind(nodeCrypto),
      configurable: true,
      writable: false,
    });
  }

  globalWithCrypto.crypto = fallback;
  return globalWithCrypto.crypto;
};

ensureGlobalCrypto();
