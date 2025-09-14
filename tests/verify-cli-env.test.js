const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { shuffle, standardDeck, hashCommitment, hexToBytes } = require('../shared/verify');

test('verify CLI uses POKERHUB_BASE_URL', async () => {
  const seed = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f';
  const nonce = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
  const commitment = hashCommitment(hexToBytes(seed), hexToBytes(nonce));
  const deck = shuffle(standardDeck(), hexToBytes(seed));

  const server = createServer((req, res) => {
    if (req.url === '/hands/abc/proof') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ seed, nonce, commitment }));
    } else if (req.url === '/hands/abc/log') {
      res.setHeader('Content-Type', 'text/plain');
      res.end(`[0,0,${JSON.stringify({ deck })}]\n`);
    } else {
      res.statusCode = 404;
      res.end();
    }
  });

  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const proc = spawn(
    'node',
    ['-r', 'ts-node/register', 'bin/verify.ts', 'proof', 'abc'],
    {
      env: { ...process.env, POKERHUB_BASE_URL: baseUrl },
    },
  );

  let stdout = '';
  let stderr = '';
  proc.stdout.on('data', (d) => {
    stdout += d.toString();
  });
  proc.stderr.on('data', (d) => {
    stderr += d.toString();
  });

  const [code] = await once(proc, 'close');
  server.close();

  assert.equal(code, 0, stderr);
  assert.match(stdout, /Proof verified/);
});
