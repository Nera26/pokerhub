require('ts-node/register');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { sanitizeFiles } = require('../sanitize-spectator-logs.ts');
const { writeFileSync, readFileSync, mkdtempSync } = require('fs');
const { tmpdir } = require('os');
const { join } = require('path');

test('sanitizeFiles redacts user IDs and table secrets', () => {
  const dir = mkdtempSync(join(tmpdir(), 'san-'));
  const file = join(dir, 'log.txt');
  const content = 'userId=abc123 tableSecret=topsecret\n{"userId":"abc123","tableSecret":"topsecret"}';
  writeFileSync(file, content);
  sanitizeFiles([file]);
  const out = readFileSync(file, 'utf-8');
  assert(!out.includes('abc123'));
  assert(!out.includes('topsecret'));
  assert(out.includes('userId=<redacted>'));
  assert(out.includes('"userId":"<redacted>"'));
  assert(out.includes('tableSecret=<redacted>'));
  assert(out.includes('"tableSecret":"<redacted>"'));
});
