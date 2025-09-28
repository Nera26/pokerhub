import * as nodeCrypto from 'node:crypto';

type CryptoLike = {
  randomUUID?: typeof nodeCrypto.randomUUID;
  [key: string]: unknown;
};

const defineRandomUUID = (cryptoTarget: CryptoLike) => {
  if (typeof nodeCrypto.randomUUID !== 'function') {
    return cryptoTarget;
  }

  if (typeof cryptoTarget.randomUUID !== 'function') {
    Object.defineProperty(cryptoTarget, 'randomUUID', {
      value: nodeCrypto.randomUUID.bind(nodeCrypto),
      configurable: true,
      writable: true,
    });
  }

  return cryptoTarget;
};

const ensureGlobalCrypto = () => {
  const globalObject = globalThis as typeof globalThis & {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    crypto?: any;
  };

  const existing = globalObject.crypto as CryptoLike | undefined;

  if (existing) {
    defineRandomUUID(existing);
    return existing;
  }

  const fallback = defineRandomUUID(
    (nodeCrypto.webcrypto as unknown as CryptoLike | undefined) ??
      ({} as CryptoLike),
  );

  Object.defineProperty(globalObject, 'crypto', {
    value: fallback,
    configurable: true,
    writable: true,
  });

  return fallback;
};

const cryptoGlobal = ensureGlobalCrypto();

if (typeof globalThis.crypto === 'undefined') {
  Object.defineProperty(globalThis, 'crypto', {
    value: cryptoGlobal,
    configurable: true,
    writable: true,
  });
}
