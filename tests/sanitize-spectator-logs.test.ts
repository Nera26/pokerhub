import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitize } from '../scripts/sanitize-spectator-logs.ts';

test('sanitize redacts PII including IPv4 and IPv6', () => {
  const content = [
    'userId=abc123 tableSecret=topsecret sessionToken=s3ss10n authToken=authtok email=john@example.com ipAddress=192.168.0.1',
    '{"userId":"abc123","tableSecret":"topsecret","sessionToken":"s3ss10n","authToken":"authtok","email":"john@example.com","ipAddress":"192.168.0.1"}',
    'ipAddress=2001:0db8:85a3:0000:0000:8a2e:0370:7334',
    '{"ipAddress":"2001:0db8:85a3:0000:0000:8a2e:0370:7334"}',
  ].join('\n');

  const out = sanitize(content);

  assert(!out.includes('abc123'));
  assert(!out.includes('topsecret'));
  assert(!out.includes('s3ss10n'));
  assert(!out.includes('authtok'));
  assert(!out.includes('john@example.com'));
  assert(!out.includes('192.168.0.1'));
  assert(!out.includes('2001:0db8:85a3:0000:0000:8a2e:0370:7334'));

  assert(out.includes('userId=<redacted>'));
  assert(out.includes('"userId":"<redacted>"'));
  assert(out.includes('ipAddress=<redacted>'));
  assert(out.includes('"ipAddress":"<redacted>"'));
});
