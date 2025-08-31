require('ts-node/register');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { sanitizeFiles } = require('../sanitize-spectator-logs.ts');
const { writeFileSync, readFileSync, mkdtempSync } = require('fs');
const { tmpdir } = require('os');
const { join } = require('path');

test('sanitizeFiles redacts user IDs, table secrets, session tokens, emails, and IP addresses', () => {
  const dir = mkdtempSync(join(tmpdir(), 'san-'));
  const file = join(dir, 'log.txt');
  const content =
    'userId=abc123 tableSecret=topsecret sessionToken=s3ss10n email=john@example.com ipAddress=192.168.0.1\n' +
    '{"userId":"abc123","tableSecret":"topsecret","sessionToken":"s3ss10n","email":"john@example.com","ipAddress":"192.168.0.1"}';
  writeFileSync(file, content);
  sanitizeFiles([file]);
  const out = readFileSync(file, 'utf-8');
  assert(!out.includes('abc123'));
  assert(!out.includes('topsecret'));
  assert(!out.includes('s3ss10n'));
  assert(!out.includes('john@example.com'));
  assert(!out.includes('192.168.0.1'));
  assert(out.includes('userId=<redacted>'));
  assert(out.includes('"userId":"<redacted>"'));
  assert(out.includes('tableSecret=<redacted>'));
  assert(out.includes('"tableSecret":"<redacted>"'));
  assert(out.includes('sessionToken=<redacted>'));
  assert(out.includes('"sessionToken":"<redacted>"'));
  assert(out.includes('email=<redacted>'));
  assert(out.includes('"email":"<redacted>"'));
  assert(out.includes('ipAddress=<redacted>'));
  assert(out.includes('"ipAddress":"<redacted>"'));
});
