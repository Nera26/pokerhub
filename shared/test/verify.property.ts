import fc from 'fast-check';
import { hexToBytes, bytesToHex } from '../verify';
import { strict as assert } from 'node:assert';

// Ensure hexToBytes and bytesToHex round-trip for arbitrary byte arrays
fc.assert(
  fc.property(fc.uint8Array(), (bytes) => {
    assert.deepStrictEqual(hexToBytes(bytesToHex(bytes)), bytes);
  })
);
