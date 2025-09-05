import { createServer, Server } from 'http';
import {
  hashCommitment,
  shuffle,
  standardDeck,
} from '@shared/verify';
import { verifyHandProof } from '../../../bin/verify-proof';

let server: Server;
let baseUrl: string;

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
  it('passes on valid hand', async () => {
    await expect(verifyHandProof('good', baseUrl)).resolves.toBeUndefined();
  });

  it('fails on deck mismatch', async () => {
    await expect(verifyHandProof('bad', baseUrl)).rejects.toThrow('Deck mismatch');
  });
});
