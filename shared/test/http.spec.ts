import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { fetchJson } from '../http';

test('validates response against schema', async (t) => {
  const restore = mock.method(
    global,
    'fetch',
    async () =>
      new Response('{"ok":true}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
  );
  t.after(restore);
  const schema = z.object({ ok: z.boolean() });
  const data = await fetchJson('http://example', schema, {});
  assert.deepEqual(data, { ok: true });
});

test('throws on schema mismatch', async (t) => {
  const restore = mock.method(
    global,
    'fetch',
    async () =>
      new Response('{}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
  );
  t.after(restore);
  const schema = z.object({ ok: z.boolean() });
  await assert.rejects(fetchJson('http://example', schema, {}));
});

test('throws on non-ok response', async (t) => {
  const restore = mock.method(
    global,
    'fetch',
    async () =>
      new Response('{"message":"fail"}', {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }),
  );
  t.after(restore);
  const schema = z.object({ ok: z.boolean() });
  await assert.rejects(
    fetchJson('http://example', schema, {}),
    (err: any) => {
      assert.equal(err.status, 500);
      assert.equal(err.message, 'fail');
      return true;
    },
  );
});
