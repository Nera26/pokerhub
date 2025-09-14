import { createServer, Server } from 'http';
import { hashCommitment, shuffle, standardDeck } from '@shared/verify';
import { spawnSync } from 'child_process';
import path from 'path';
let server: Server;
let baseUrl: string;
const requests: string[] = [];

beforeAll((done) => {
  const seed = '11'.repeat(32);
  const nonce = '22'.repeat(16);
  const commitment = hashCommitment(Buffer.from(seed, 'hex'), Buffer.from(nonce, 'hex'));
  const proof = { seed, nonce, commitment };
  const deck = shuffle(standardDeck(), Buffer.from(seed, 'hex'));
  const log = `${JSON.stringify([0, {}, { deck }, {}])}\n`;
  const badDeck = deck.slice();
  badDeck[0] = (badDeck[0] + 1) % 52;
  const badLog = `${JSON.stringify([0, {}, { deck: badDeck }, {}])}\n`;

  server = createServer((req, res) => {
    if (req.url) requests.push(req.url);
    if (req.url === '/hands/good/proof') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(proof));
    } else if (req.url === '/hands/good/log') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(log);
    } else if (req.url === '/hands/bad/proof') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(proof));
    } else if (req.url === '/hands/bad/log') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(badLog);
    } else {
      res.writeHead(404);
      res.end();
    }
  }).listen(0, () => {
    const { port } = server.address() as any;
    baseUrl = `http://localhost:${port}`;
    done();
  });
});

afterAll((done) => {
  server.close(done);
});

describe('verify-proof CLI', () => {
  it('uses POKERHUB_BASE_URL when invoking CLI', () => {
    const cli = path.resolve(__dirname, '../../../bin/verify-hand');
    spawnSync('node', [cli, 'good'], {
      env: { ...process.env, POKERHUB_BASE_URL: baseUrl },
      encoding: 'utf8',
    });
    expect(requests).toContain('/hands/good/proof');
  });
});
