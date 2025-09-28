import { randomUUID, webcrypto } from 'node:crypto';

const globalFallback = globalThis as typeof globalThis & { crypto?: Crypto };

if (typeof globalFallback.crypto === 'undefined') {
  globalFallback.crypto = webcrypto as Crypto;
}

if (typeof globalFallback.crypto.randomUUID !== 'function') {
  Object.defineProperty(globalFallback.crypto, 'randomUUID', {
    value: randomUUID,
    configurable: true,
    writable: false,
  });
}
